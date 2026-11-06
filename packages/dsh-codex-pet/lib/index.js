import { PET_SOURCES, codexHome, codexPetsDir, loadPetRegistry, loadPetRegistry as loadPetRegistry$1, petEntryView, petPackageRoot, petPackageRoot as petPackageRoot$1, userPetsDir } from "./registry.js";
import { PetService, PetService as PetService$1, SUMMARY_TIMEOUT_MS, persistPath, userSoundsDir } from "./service.js";
import { PET_API_PREFIX, PET_ASSET_PREFIX, SOUND_ROUTE, makeCodexPetRoutes, makeCodexPetRoutes as makeCodexPetRoutes$1 } from "./routes.js";
// packages/dsh-codex-pet/src/index.ts
/**
* dsh-codex-pet host half — builds the Codex atlas pet registry once at
* startup and mounts the '/api/codex-pet/*' JSON API plus the '/codex-pet/<id>/*'
* asset routes on the DSH web server. The browser half (the './client' export)
* renders the selected pet, drives it through those same-origin endpoints, and
* seats a settings section that edits them directly. Adding a pet means
* dropping a <pet>/pet.json + <pet>/spritesheet.webp into assets/ or
* ~/.dsh/pets — never touching host or client code.
* @module dsh-codex-pet
*/
/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
const name = "codex-pet";
/**
* The web server is required to mount the base pet. LLM is optional because
* summary routes report a clear error when an adapter is not installed.
*/
const inject = ["webServer"];
/** Register the pet service and its API + asset routes on the context. */
function apply(ctx, config = {}) {
	const packageRoot = petPackageRoot$1(import.meta.url);
	const loadPets = config.registry ? null : (codexPets) => loadPetRegistry$1({
		packageRoot,
		codexPets
	});
	const registry = config.registry ?? loadPets(true);
	const service = new PetService$1({
		...config,
		registry,
		loadPets,
		packageRoot
	});
	const getLlm = () => config.llm ?? ctx.get("llm") ?? null;
	const routes = makeCodexPetRoutes$1({
		service,
		getLlm
	});
	ctx.effect(() => {
		const disposers = routes.map((route) => ctx.webServer.register(route));
		return () => {
			for (const dispose of disposers) dispose();
		};
	}, "codex-pet: routes");
	ctx.effect(() => {
		const offError = ctx.on("agent/error", ({ agent }) => service.pulse("error", agent.id));
		return () => {
			offError?.();
		};
	}, "codex-pet: scenario-events");
}
export { PET_API_PREFIX, PET_ASSET_PREFIX, PET_SOURCES, PetService, SOUND_ROUTE, SUMMARY_TIMEOUT_MS, apply, codexHome, codexPetsDir, inject, loadPetRegistry, makeCodexPetRoutes, name, persistPath, petEntryView, petPackageRoot, userPetsDir, userSoundsDir };

//# sourceMappingURL=index.js.map