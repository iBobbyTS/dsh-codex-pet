import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
// packages/dsh-codex-pet/src/registry.ts
/**
* Pet registry — the Codex spritesheet-atlas contract. One pet is a directory
* holding a 'pet.json' manifest plus one atlas image; nothing else is required,
* and no host or client code changes when a pet is added. The registry scans
* two sources, later sources overriding earlier ones on an id collision:
*
*   1. the package's own 'assets' subdirectories (built-in pets);
*   2. '${DSH_HOME:-~/.dsh}/pets' subdirectories (user pets, highest precedence).
*
* The manifest is the Codex pet shape: id / displayName / description /
* spritesheetPath, with optional spriteVersionNumber (auto-detected from the
* image dimensions when omitted), size and pin defaults.
*
* Atlas geometry is fixed by the Codex contract: 8 columns of 192x208 cells,
* 9 rows (v1) or 11 rows (v2, adds the 16 mouse-tracking "look" cells).
* @module dsh-codex-pet/registry
*/
const FRAME_WIDTH = 192;
const FRAME_HEIGHT = 208;
const COLUMNS = 8;
const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const SEGMENT_PATTERN = /^[A-Za-z0-9._-]+$/;
/** Absolute package root, resolved from a module URL (src/ or lib/). */
function petPackageRoot(importMetaUrl) {
	return fileURLToPath(new URL("../", importMetaUrl));
}
/** DSH home directory: $DSH_HOME or ~/.dsh. */
function dshHome(env = process.env, home = homedir()) {
	const raw = env && env.DSH_HOME;
	return raw && raw.trim() !== "" ? raw.trim() : join(home, ".dsh");
}
/** The user pets directory: ${DSH_HOME:-~/.dsh}/pets. */
function userPetsDir(env = process.env, home = homedir()) {
	return join(dshHome(env, home), "pets");
}
/** Codex home directory: $CODEX_HOME or ~/.codex. */
function codexHome(env = process.env, home = homedir()) {
	const raw = env && env.CODEX_HOME;
	return raw && raw.trim() !== "" ? raw.trim() : join(home, ".codex");
}
/**
* The Codex pets directory: ${CODEX_HOME:-~/.codex}/pets. Codex stores every
* installed desktop pet there as '<pet>/pet.json' + '<pet>/spritesheet.webp',
* which is the very contract this plugin renders — so they can be used in
* place, without copying anything into ~/.dsh/pets.
*/
function codexPetsDir(env = process.env, home = homedir()) {
	return join(codexHome(env, home), "pets");
}
/** Where a registry entry came from. */
const PET_SOURCES = [
	"builtin",
	"codex",
	"user"
];
/**
* Read image dimensions from a WebP/PNG/GIF header (no decode). Returns null
* when the format is unrecognised. Ported from the codex-to-dsh-pet build.js.
*/
function detectDimensions(buffer) {
	if (buffer.length >= 30 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
		const chunk = buffer.toString("ascii", 12, 16);
		if (chunk === "VP8X" && buffer.length >= 30) return {
			width: 1 + (buffer[24] | buffer[25] << 8 | buffer[26] << 16),
			height: 1 + (buffer[27] | buffer[28] << 8 | buffer[29] << 16)
		};
		if (chunk === "VP8L" && buffer.length >= 25) {
			const b0 = buffer[21], b1 = buffer[22], b2 = buffer[23], b3 = buffer[24];
			return {
				width: ((b1 & 63) << 8 | b0) + 1,
				height: ((b3 & 15) << 10 | b2 << 2 | b1 >> 6) + 1
			};
		}
		if (chunk === "VP8 " && buffer.length >= 27) return {
			width: (buffer[23] | buffer[24] << 8) & 16383,
			height: (buffer[25] | buffer[26] << 8) & 16383
		};
	}
	if (buffer.length >= 24 && buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71) return {
		width: buffer.readUInt32BE(16),
		height: buffer.readUInt32BE(20)
	};
	if (buffer.length >= 10) {
		const sig = buffer.toString("ascii", 0, 6);
		if (sig === "GIF87a" || sig === "GIF89a") return {
			width: buffer.readUInt16LE(6),
			height: buffer.readUInt16LE(8)
		};
	}
	return null;
}
/** Auto-detect the Codex atlas version from the image dimensions. */
function detectSpriteVersion(buffer) {
	const dim = detectDimensions(buffer);
	if (!dim) return null;
	if (dim.width === 1536 && dim.height === 1872) return 1;
	if (dim.width === 1536 && dim.height === 2288) return 2;
	return null;
}
/** Detect the image file extension from its header ('.webp'/'.png'/'.gif'), or null. */
function detectImageExt(buffer) {
	if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return ".webp";
	if (buffer.length >= 8 && buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71) return ".png";
	if (buffer.length >= 6) {
		const sig = buffer.toString("ascii", 0, 6);
		if (sig === "GIF87a" || sig === "GIF89a") return ".gif";
	}
	return null;
}
/** Build the browser URL of one pet asset. */
function assetUrl(prefix, id, file) {
	const rel = String(file).split("/").filter((segment) => segment !== "").join("/");
	return prefix + "/" + encodeURIComponent(id) + "/" + rel;
}
/** Finite integer guard, else the fallback (0 disables the value). */
function finiteInt(value, fallback, max) {
	return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= max ? value : fallback;
}
/**
* Normalize one parsed manifest into a renderable pet entry, or undefined
* (with a warning recorded) when the manifest violates the contract.
*/
function resolvePetManifest(input, dir, options = {}) {
	const raw = input;
	const { assetPrefix = "/codex-pet", warnings = [], source = "builtin" } = options;
	const warn = (message) => {
		warnings.push(message);
	};
	if (typeof raw !== "object" || raw === null) {
		warn("manifest is not an object");
		return;
	}
	const id = typeof raw.id === "string" ? raw.id.trim() : "";
	if (!ID_PATTERN.test(id)) {
		warn("manifest id " + JSON.stringify(String(raw.id)) + " is not a lowercase kebab id");
		return;
	}
	const displayName = typeof raw.displayName === "string" && raw.displayName.trim() !== "" ? raw.displayName.trim().slice(0, 80) : id;
	const description = typeof raw.description === "string" ? raw.description.trim() : "";
	const spritesheet = typeof raw.spritesheetPath === "string" && raw.spritesheetPath.trim() !== "" ? raw.spritesheetPath.trim() : "spritesheet.webp";
	const segments = spritesheet.split("/").filter((segment) => segment !== "");
	if (segments.length === 0 || spritesheet.includes("\\") || segments.some((segment) => segment === ".." || !SEGMENT_PATTERN.test(segment))) {
		warn("manifest " + id + ": spritesheetPath " + JSON.stringify(spritesheet) + " is not a safe relative path");
		return;
	}
	let spriteVersionNumber = raw.spriteVersionNumber === 1 || raw.spriteVersionNumber === 2 ? raw.spriteVersionNumber : null;
	if (spriteVersionNumber == null) {
		const atlasFile = join(dir, segments.join("/"));
		if (existsSync(atlasFile)) try {
			spriteVersionNumber = detectSpriteVersion(readFileSync(atlasFile));
		} catch {}
	}
	if (spriteVersionNumber == null) spriteVersionNumber = 2;
	const size = finiteInt(raw.size, 120, 512);
	const pin = typeof raw.pin === "string" ? raw.pin : "bottom-right";
	return {
		id,
		displayName,
		description,
		spriteVersionNumber,
		size,
		pin,
		source,
		cell: {
			width: 192,
			height: 208
		},
		columns: 8,
		rows: spriteVersionNumber === 2 ? 11 : 9,
		atlasUrl: assetUrl(assetPrefix, id, spritesheet),
		manifestUrl: assetUrl(assetPrefix, id, "pet.json"),
		dir,
		spritesheetPath: segments.join("/")
	};
}
/** Scan one directory of pet folders; entries come back in name order. */
function scanPetDir(dir, options) {
	if (!existsSync(dir)) return [];
	let names = [];
	try {
		names = readdirSync(dir).filter((name) => !name.startsWith("."));
	} catch {
		return [];
	}
	names.sort();
	const entries = [];
	for (const name of names) {
		const manifestFile = join(dir, name, "pet.json");
		if (!existsSync(manifestFile)) continue;
		let parsed;
		try {
			parsed = JSON.parse(readFileSync(manifestFile, "utf8"));
		} catch (error) {
			options.warnings.push("skipping " + manifestFile + ": " + (error instanceof Error ? error.message : String(error)));
			continue;
		}
		const entry = resolvePetManifest(parsed, join(dir, name), options);
		if (entry !== void 0) entries.push(entry);
	}
	return entries;
}
/**
* Load the pet registry: built-in 'assets/*' first, then the Codex pets
* directory (when enabled), then the user pets directory — each later source
* overrides an earlier one on an id collision. Codex pets are used in place,
* straight from '<codex home>/pets', so they stay in sync with Codex itself;
* the 'codexPets' switch simply leaves that source out.
* Never throws on a bad manifest: it skips it and records a warning.
*/
function loadPetRegistry(options) {
	const { packageRoot, assetPrefix = "/codex-pet", petsDir, codexPetsDir: codexDir = codexPetsDir(), codexPets = true } = options;
	const warnings = [];
	const byId = /* @__PURE__ */ new Map();
	const scan = (dir, source) => {
		for (const entry of scanPetDir(dir, {
			assetPrefix,
			warnings,
			source
		})) {
			if (byId.has(entry.id)) warnings.push(source + " pet " + entry.id + " overrides the earlier one");
			byId.set(entry.id, entry);
		}
	};
	scan(join(packageRoot, "assets"), "builtin");
	if (codexPets) scan(codexDir, "codex");
	scan(petsDir !== void 0 ? petsDir : userPetsDir(), "user");
	const entries = [...byId.values()];
	return {
		entries,
		warnings,
		/** The Codex pets directory that was scanned (or would be). */
		codexPetsDir: codexDir,
		/** Whether Codex pets were included in this registry. */
		codexPets: codexPets === true,
		byId: (id) => byId.get(id),
		defaultEntry: () => entries[0],
		/** Add (or replace) one entry at runtime — used by the GUI import flow. */
		add(entry) {
			byId.set(entry.id, entry);
			entries.splice(0, entries.length, ...byId.values());
		}
	};
}
/** Strip host-only fields, leaving the client-visible definition. */
function petEntryView(entry) {
	return {
		id: entry.id,
		displayName: entry.displayName,
		description: entry.description,
		spriteVersionNumber: entry.spriteVersionNumber,
		size: entry.size,
		pin: entry.pin,
		source: entry.source ?? "builtin",
		cell: entry.cell,
		columns: entry.columns,
		rows: entry.rows,
		atlasUrl: entry.atlasUrl,
		manifestUrl: entry.manifestUrl
	};
}
export { COLUMNS, FRAME_HEIGHT, FRAME_WIDTH, PET_SOURCES, codexHome, codexPetsDir, detectDimensions, detectImageExt, detectSpriteVersion, dshHome, loadPetRegistry, petEntryView, petPackageRoot, resolvePetManifest, userPetsDir };

//# sourceMappingURL=registry.js.map