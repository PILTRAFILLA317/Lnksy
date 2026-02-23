<script lang="ts">
	import { invalidateAll, goto } from "$app/navigation";
	import PanelShell from "./PanelShell.svelte";
	import UpgradeCTA from "./UpgradeCTA.svelte";
	import Button from "$lib/components/ui/Button.svelte";
	import Input from "$lib/components/ui/Input.svelte";
	import Modal from "$lib/components/ui/Modal.svelte";
	import LinkCard from "$lib/components/ui/LinkCard.svelte";
	import { studio } from "$lib/stores/studio.svelte.js";
	import { FREE_LINK_LIMIT, FREE_COMPONENT_LIMIT } from "$lib/types.js";
	import type {
		Link,
		ProfileComponent,
		Profile,
		MainLinksLayout,
		ComponentType,
	} from "$lib/types.js";
	import {
		Link2,
		Youtube,
		Music,
		Type,
		Minus,
		Pencil,
		Copy,
		ArrowUp,
		ArrowDown,
		Trash2,
		LayoutGrid,
		Eye,
		EyeOff,
		ChevronRight,
		Plus,
	} from "@lucide/svelte";

	interface Props {
		links: Link[];
		components: ProfileComponent[];
		profile: Profile;
		isPro: boolean;
	}

	let { links, components, profile, isPro }: Props = $props();

	// ─── Component type config ─────────────────────────────────
	const COMPONENT_TYPE_META: Record<
		ComponentType,
		{ label: string; icon: typeof Link2; desc: string }
	> = {
		links:   { label: "Links",   icon: Link2,  desc: "A list of clickable links" },
		youtube: { label: "YouTube", icon: Youtube, desc: "Embed a YouTube video" },
		spotify: { label: "Spotify", icon: Music,   desc: "Embed a Spotify track or playlist" },
		text:    { label: "Text",    icon: Type,    desc: "A paragraph of text" },
		divider: { label: "Divider", icon: Minus,   desc: "Visual separator" },
	};

	const LAYOUT_OPTIONS: {
		value: MainLinksLayout;
		label: string;
		pro: boolean;
	}[] = [
		{ value: "LIST_ICON", label: "List", pro: false },
		{ value: "GRID_ICON", label: "Grid", pro: false },
		{ value: "GRID_IMAGE", label: "Grid + Img", pro: true },
		{ value: "LIST_IMAGE", label: "List + Img", pro: true },
	];

	// ─── State ─────────────────────────────────────────────────
	let expandedId = $state<string | null>(null);
	let showAddModal = $state(false);

	$effect(() => {
		if (components.length === 1 && expandedId === null) {
			expandedId = components[0]?.id ?? null;
		}
	});

	function linksForComponent(componentId: string): Link[] {
		return links.filter((l) => l.component_id === componentId);
	}

	const totalLinkCount = $derived(links.length);
	const totalComponentCount = $derived(components.length);
	const canAddLink = $derived(isPro || totalLinkCount < FREE_LINK_LIMIT);
	const canAddComponent = $derived(
		isPro || totalComponentCount < FREE_COMPONENT_LIMIT,
	);

	// ─── Component actions (fetch-based) ─────────────────────
	function enhanceAction(successMsg: string, cb?: () => void) {
		return () => {
			return async ({ result }: { result: { type: string } }) => {
				if (result.type === "success") {
					cb?.();
					invalidateAll();
					studio.showToast(successMsg);
				} else if (result.type === "failure") {
					studio.showToast("Action failed", "error");
				}
			};
		};
	}

	async function postAction(
		action: string,
		data: Record<string, string>,
		successMsg: string,
	) {
		const fd = new FormData();
		for (const [k, v] of Object.entries(data)) fd.set(k, v);
		const res = await fetch(`/app?/${action}`, {
			method: "POST",
			body: fd,
		});
		invalidateAll();
		studio.showToast(successMsg);
	}

	// Add component
	function addComponent(type: ComponentType) {
		showAddModal = false;
		postAction("addComponent", { type }, "Component added");
	}

	// Toggle component
	function toggleComponent(id: string) {
		postAction(
			"toggleComponent",
			{ componentId: id },
			"Visibility updated",
		);
	}

	// Duplicate component
	function duplicateComponent(id: string) {
		postAction(
			"duplicateComponent",
			{ componentId: id },
			"Component duplicated",
		);
	}

	// Delete component
	function deleteComponent(id: string) {
		if (!confirm("Delete this component and all its content?")) return;
		expandedId = null;
		postAction("deleteComponent", { componentId: id }, "Component deleted");
	}

	// Move up / down (accessible fallback)
	function moveUp(id: string) {
		postAction("moveComponentUp", { componentId: id }, "Moved up");
	}

	function moveDown(id: string) {
		postAction("moveComponentDown", { componentId: id }, "Moved down");
	}

	// ─── Component DnD  ────────────────────────────────────────
	let compDragIndex = $state<number | null>(null);
	let compDragOverIndex = $state<number | null>(null);

	function handleCompDragStart(e: DragEvent, index: number) {
		compDragIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("text/plain", String(index));
		}
	}

	function handleCompDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
		compDragOverIndex = index;
	}

	function handleCompDrop(e: DragEvent, dropIndex: number) {
		e.preventDefault();
		if (compDragIndex === null || compDragIndex === dropIndex) {
			compDragIndex = null;
			compDragOverIndex = null;
			return;
		}
		const reordered = [...components];
		const [moved] = reordered.splice(compDragIndex, 1);
		reordered.splice(dropIndex, 0, moved);
		compDragIndex = null;
		compDragOverIndex = null;
		const order = reordered.map((c) => c.id);
		const fd = new FormData();
		fd.set("order", JSON.stringify(order));
		fetch("/app?/reorderComponents", { method: "POST", body: fd }).then(
			() => {
				invalidateAll();
				studio.showToast("Components reordered");
			},
		);
	}

	function handleCompDragEnd() {
		compDragIndex = null;
		compDragOverIndex = null;
	}

	// ─── Link DnD (within expanded links component) ────────────
	let dragIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);
	let dragCompId = $state<string | null>(null);

	function handleDragStart(e: DragEvent, index: number, compId: string) {
		dragIndex = index;
		dragCompId = compId;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("text/plain", String(index));
		}
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
		dragOverIndex = index;
	}

	function handleDragLeave() {
		dragOverIndex = null;
	}

	function handleDrop(e: DragEvent, dropIndex: number, compId: string) {
		e.preventDefault();
		if (
			dragIndex === null ||
			dragIndex === dropIndex ||
			dragCompId !== compId
		) {
			dragIndex = null;
			dragOverIndex = null;
			dragCompId = null;
			return;
		}
		const cLinks = linksForComponent(compId);
		const reordered = [...cLinks];
		const [moved] = reordered.splice(dragIndex, 1);
		reordered.splice(dropIndex, 0, moved);
		dragIndex = null;
		dragOverIndex = null;
		dragCompId = null;
		const order = reordered.map((l) => l.id);
		const fd = new FormData();
		fd.set("order", JSON.stringify(order));
		fetch("/app?/reorderLinks", { method: "POST", body: fd }).then(() => {
			invalidateAll();
			studio.showToast("Links reordered");
		});
	}

	function handleDragEnd() {
		dragIndex = null;
		dragOverIndex = null;
		dragCompId = null;
	}

	// ─── Add link modal ────────────────────────────────────────
	let addToCompId = $state<string | null>(null);
	let newTitle = $state("");
	let newUrl = $state("");
	let newSubtitle = $state("");

	function openAddLinkModal(compId: string) {
		addToCompId = compId;
	}
	function resetAddForm() {
		newTitle = "";
		newUrl = "";
		newSubtitle = "";
		addToCompId = null;
	}

	// ─── Edit link modal ──────────────────────────────────────
	let editingLink = $state<Link | null>(null);
	let editTitle = $state("");
	let editUrl = $state("");
	let editSubtitle = $state("");
	let editStartAt = $state("");
	let editEndAt = $state("");
	let editHighlight = $state(false);

	function openEdit(link: Link) {
		editingLink = link;
		editTitle = link.title;
		editUrl = link.url;
		editSubtitle = link.subtitle ?? "";
		editStartAt = link.start_at ?? "";
		editEndAt = link.end_at ?? "";
		editHighlight = link.highlight;
	}

	// ─── Inline component title edit ──────────────────────────
	let editingTitleId = $state<string | null>(null);
	let titleValue = $state("");

	function startEditTitle(comp: ProfileComponent) {
		editingTitleId = comp.id;
		titleValue = comp.title ?? "";
	}

	function saveTitle(compId: string) {
		postAction(
			"updateComponent",
			{
				componentId: compId,
				title: titleValue,
			},
			"Title updated",
		);
		editingTitleId = null;
	}

	// ─── Inline config editors ────────────────────────────────
	let editingConfigId = $state<string | null>(null);
	let configDraft = $state<Record<string, any>>({});

	function startEditConfig(comp: ProfileComponent) {
		editingConfigId = comp.id;
		configDraft = { ...comp.config };
	}

	function saveConfig(compId: string) {
		postAction(
			"updateComponent",
			{
				componentId: compId,
				config: JSON.stringify(configDraft),
			},
			"Updated",
		);
		editingConfigId = null;
	}
</script>

<PanelShell title="Components">
	<!-- Usage counters (free users) -->
	{#if !isPro}
		<div class="mb-4 space-y-2">
			<div class="flex items-center justify-between">
				<span class="text-[11px] font-medium text-gray-500">
					Components: {totalComponentCount} / {FREE_COMPONENT_LIMIT}
				</span>
				<span class="text-[11px] font-medium text-gray-500">
					Links: {totalLinkCount} / {FREE_LINK_LIMIT}
				</span>
			</div>
			<div class="flex gap-2">
				<div
					class="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden"
				>
					<div
						class="h-full rounded-full transition-all duration-500 ease-out
              {totalComponentCount >= FREE_COMPONENT_LIMIT
							? 'bg-gradient-to-r from-amber-400 to-amber-500'
							: 'bg-gradient-to-r from-indigo-400 to-indigo-500'}"
						style="width: {Math.min(
							100,
							(totalComponentCount / FREE_COMPONENT_LIMIT) * 100,
						)}%"
					></div>
				</div>
				<div
					class="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden"
				>
					<div
						class="h-full rounded-full transition-all duration-500 ease-out
              {totalLinkCount >= FREE_LINK_LIMIT
							? 'bg-gradient-to-r from-amber-400 to-amber-500'
							: 'bg-gradient-to-r from-indigo-400 to-indigo-500'}"
						style="width: {Math.min(
							100,
							(totalLinkCount / FREE_LINK_LIMIT) * 100,
						)}%"
					></div>
				</div>
			</div>
		</div>
	{/if}

	{#if !canAddComponent && !isPro}
		<div class="mb-4">
			<UpgradeCTA
				message="You've reached {FREE_COMPONENT_LIMIT} components. Upgrade for unlimited."
			/>
		</div>
	{/if}

	<!-- Component blocks -->
	<div class="space-y-2.5 pb-5">
		{#each components as comp, ci (comp.id)}
			{@const isExpanded = expandedId === comp.id}
			{@const meta = COMPONENT_TYPE_META[comp.type]}
			{@const cLinks =
				comp.type === "links" ? linksForComponent(comp.id) : []}

			<div
				class="section-card rounded-2xl transition-all duration-200 overflow-hidden
          {compDragIndex === ci ? 'opacity-30 scale-[0.97]' : ''}
          {compDragOverIndex === ci && compDragIndex !== ci
					? 'ring-2 ring-indigo-400/50 shadow-lg shadow-indigo-100/50'
					: ''}
          {isExpanded
					? 'shadow-md shadow-gray-200/80 ring-1 ring-gray-200/60'
					: 'shadow-sm shadow-gray-100/60 hover:shadow-md hover:shadow-gray-200/60 ring-1 ring-gray-100'}"
			>
				<!-- Component header (draggable) -->
				<div
					role="listitem"
					draggable="true"
					ondragstart={(e) => handleCompDragStart(e, ci)}
					ondragover={(e) => handleCompDragOver(e, ci)}
					ondragleave={() => {
						compDragOverIndex = null;
					}}
					ondrop={(e) => handleCompDrop(e, ci)}
					ondragend={handleCompDragEnd}
					class="flex items-center gap-2.5 px-3 py-3 transition-colors
            {isExpanded
						? 'bg-gradient-to-r from-gray-50/90 to-white'
						: 'bg-white'}"
				>
					<!-- Drag handle -->
					<div
						class="cursor-grab active:cursor-grabbing text-gray-300
            hover:text-gray-400 touch-none shrink-0 transition-colors"
					>
						<svg
							class="w-4 h-4"
							viewBox="0 0 16 16"
							fill="currentColor"
						>
							<circle cx="5" cy="3" r="1.2" />
							<circle cx="11" cy="3" r="1.2" />
							<circle cx="5" cy="8" r="1.2" />
							<circle cx="11" cy="8" r="1.2" />
							<circle cx="5" cy="13" r="1.2" />
							<circle cx="11" cy="13" r="1.2" />
						</svg>
					</div>

					<!-- Type icon -->
					<span class="shrink-0 text-gray-400">
						<svelte:component this={meta.icon} class="w-4 h-4" />
					</span>

					<!-- Title + meta (clickable to expand) -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="flex-1 min-w-0 cursor-pointer select-none"
						onclick={() => {
							expandedId = isExpanded ? null : comp.id;
						}}
					>
						{#if editingTitleId === comp.id}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="flex gap-1.5 items-center"
								onclick={(e) => e.stopPropagation()}
							>
								<input
									type="text"
									bind:value={titleValue}
									placeholder="Component title"
									class="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5
                    text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400/40
                    focus:border-indigo-300 shadow-sm"
									onkeydown={(e) => {
										if (e.key === "Enter")
											saveTitle(comp.id);
									}}
								/>
								<button
									onclick={() => saveTitle(comp.id)}
									class="text-[11px] bg-indigo-600 text-white font-medium px-2.5 py-1
                    rounded-md hover:bg-indigo-700 transition-colors"
									>Save</button
								>
								<button
									onclick={() => {
										editingTitleId = null;
									}}
									class="text-[11px] text-gray-400 hover:text-gray-600 px-1.5 py-1"
									>Cancel</button
								>
							</div>
						{:else}
							<p
								class="text-[13px] font-semibold text-gray-800 truncate leading-tight"
							>
								{comp.title || meta.label}
							</p>
							<div class="flex items-center gap-2 mt-1">
								<span
									class="text-[10px] font-medium bg-gray-100 text-gray-500
                  px-2 py-0.5 rounded-md">{meta.label}</span
								>
								{#if comp.type === "links"}
									<span class="text-[10px] text-gray-400"
										>{cLinks.length} links</span
									>
								{/if}
								{#if !comp.is_visible}
									<span
										class="inline-flex items-center gap-0.5 text-[10px] font-medium
                    bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md"
									>
										Hidden
									</span>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Visibility toggle -->
					<button
						onclick={() => toggleComponent(comp.id)}
						class="p-1.5 rounded-lg transition-colors shrink-0
              {comp.is_visible
							? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
							: 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}"
						aria-label={comp.is_visible ? "Hide" : "Show"}
					>
						{#if comp.is_visible}
							<Eye class="w-4 h-4" />
						{:else}
							<EyeOff class="w-4 h-4" />
						{/if}
					</button>

					<!-- Expand chevron -->
					<button
						onclick={() => {
							expandedId = isExpanded ? null : comp.id;
						}}
						class="p-1.5 rounded-lg hover:bg-gray-100 shrink-0 transition-colors"
						aria-label={isExpanded ? "Collapse" : "Expand"}
					>
						<ChevronRight class="w-4 h-4 text-gray-400 transition-transform duration-200 {isExpanded ? 'rotate-90' : ''}" />
					</button>
				</div>

				<!-- Expanded content -->
				{#if isExpanded}
					<div
						class="border-t border-gray-100 bg-gradient-to-b from-gray-50/50 to-white"
					>
						<!-- Action row -->
						<div
							class="flex items-center gap-1.5 px-3 pt-3 pb-2 flex-wrap"
						>
							<button
								onclick={() => startEditTitle(comp)}
								class="action-chip">
								<Pencil class="w-3 h-3" /> Rename
							</button>
							<button
								onclick={() => duplicateComponent(comp.id)}
								class="action-chip">
								<Copy class="w-3 h-3" /> Duplicate
							</button>
							{#if ci > 0}
								<button
									onclick={() => moveUp(comp.id)}
									class="action-chip">
									<ArrowUp class="w-3 h-3" /> Move up
								</button>
							{/if}
							{#if ci < components.length - 1}
								<button
									onclick={() => moveDown(comp.id)}
									class="action-chip">
									<ArrowDown class="w-3 h-3" /> Move down
								</button>
							{/if}
							<button
								onclick={() => deleteComponent(comp.id)}
								class="action-chip action-chip-danger">
								<Trash2 class="w-3 h-3" /> Delete
							</button>
						</div>

						<!-- Type-specific config -->
						{#if comp.type === "links"}
							<!-- Layout selector -->
							<div class="px-3 pb-3">
								<p
									class="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2"
								>
									Layout
								</p>
								<div class="grid grid-cols-4 gap-1.5">
									{#each LAYOUT_OPTIONS as opt}
										{@const selected =
											comp.config?.layout === opt.value}
										{@const locked = opt.pro && !isPro}
										<button
											type={locked ? "button" : "button"}
											onclick={locked
												? () => goto("/app/billing")
												: () => {
														postAction(
															"updateComponent",
															{
																componentId:
																	comp.id,
																config: JSON.stringify(
																	{
																		...comp.config,
																		layout: opt.value,
																	},
																),
															},
															"Layout updated",
														);
													}}
											class="w-full flex flex-col items-center gap-1 py-2 px-1 rounded-xl
                        border transition-all duration-150
                        {selected
												? 'border-indigo-500 bg-indigo-50 shadow-sm'
												: 'border-gray-150 bg-white hover:border-gray-300'}
                        {locked
												? 'opacity-35 cursor-not-allowed'
												: 'cursor-pointer'}"
										>
											<span
												class="text-[10px] font-semibold {selected
													? 'text-indigo-700'
													: 'text-gray-500'}"
											>
												{opt.label}
											</span>
											{#if opt.pro && !isPro}
												<span
													class="text-[7px] font-bold uppercase text-amber-600"
													>PRO</span
												>
											{/if}
										</button>
									{/each}
								</div>
							</div>

							<div class="mx-3 border-t border-gray-100"></div>

							<!-- Links list -->
							<div class="px-3 pt-3 pb-2 space-y-1.5">
								{#each cLinks as link, i (link.id)}
									<LinkCard
										{link}
										editable
										dragging={dragCompId === comp.id &&
											dragIndex === i}
										dragOver={dragCompId === comp.id &&
											dragOverIndex === i}
										ondragstart={(e) =>
											handleDragStart(e, i, comp.id)}
										ondragover={(e) => handleDragOver(e, i)}
										ondragleave={handleDragLeave}
										ondrop={(e) =>
											handleDrop(e, i, comp.id)}
										ondragend={handleDragEnd}
										onEdit={() => openEdit(link)}
										onToggle={() => {
											const fd = new FormData();
											fd.set("linkId", link.id);
											fd.set(
												"isActive",
												String(link.is_active),
											);
											fetch("/app?/toggleLink", {
												method: "POST",
												body: fd,
											}).then(() => invalidateAll());
										}}
										onDelete={() => {
											if (!confirm("Delete this link?"))
												return;
											postAction(
												"deleteLink",
												{ linkId: link.id },
												"Link deleted",
											);
										}}
										onDuplicate={() => {
											postAction(
												"duplicateLink",
												{ linkId: link.id },
												"Link duplicated",
											);
										}}
									/>
								{:else}
									<div
										class="flex flex-col items-center py-6 text-center"
									>
										<p class="text-xs text-gray-400">
											No links yet
										</p>
										<p
											class="text-[10px] text-gray-300 mt-0.5"
										>
											Add your first link below
										</p>
									</div>
								{/each}
							</div>

							<!-- Add link -->
							<div class="px-3 pb-3">
								<button
									onclick={() => openAddLinkModal(comp.id)}
									disabled={!canAddLink}
									class="add-link-btn w-full flex items-center justify-center gap-1.5
                    text-xs font-semibold py-2.5 rounded-xl transition-all duration-200
                    disabled:opacity-30 disabled:pointer-events-none
                    text-indigo-600 hover:text-indigo-700
                    bg-indigo-50/60 hover:bg-indigo-50
                    border border-indigo-100 hover:border-indigo-200
                    hover:shadow-sm active:scale-[0.98]"
								>
									+ Add link
								</button>
							</div>
						{:else if comp.type === "youtube"}
							<div class="px-3 pb-3 space-y-2">
								<label
									class="text-[10px] font-semibold uppercase tracking-wider text-gray-400"
								>
									YouTube Video URL or ID
								</label>
								<div class="flex gap-1.5">
									<input
										type="text"
										value={comp.config?.videoId ?? ""}
										placeholder="e.g. dQw4w9WgXcQ or full URL"
										class="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-2
                      focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
										onchange={(e) => {
											let val = (
												e.target as HTMLInputElement
											).value.trim();
											// Extract video ID from full URL
											const urlMatch = val.match(
												/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
											);
											if (urlMatch) val = urlMatch[1];
											postAction(
												"updateComponent",
												{
													componentId: comp.id,
													config: JSON.stringify({
														...comp.config,
														videoId: val,
													}),
												},
												"Video updated",
											);
										}}
									/>
								</div>
								{#if comp.config?.videoId}
									<div
										class="relative w-full rounded-lg overflow-hidden"
										style="padding-bottom: 56.25%;"
									>
										<iframe
											src="https://www.youtube.com/embed/{comp
												.config.videoId}"
											class="absolute inset-0 w-full h-full"
											title="Preview"
											frameborder="0"
											loading="lazy"
										></iframe>
									</div>
								{/if}
							</div>
						{:else if comp.type === "spotify"}
							<div class="px-3 pb-3 space-y-2">
								<label
									class="text-[10px] font-semibold uppercase tracking-wider text-gray-400"
								>
									Spotify URL
								</label>
								<input
									type="text"
									value={comp.config?.embedUri ?? ""}
									placeholder="https://open.spotify.com/track/..."
									class="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2
                    focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
									onchange={(e) => {
										const raw = (e.target as HTMLInputElement).value.trim();

										// Auto-detect type using regex (handles locale prefixes, ?si= params, etc.)
										let embedType = comp.config?.embedType ?? "track";
										const typeMatch = raw.match(/(track|album|playlist|episode|show)\//);
										if (typeMatch) embedType = typeMatch[1] === "episode" || typeMatch[1] === "show" ? "track" : typeMatch[1];

										// Save raw URL — SpotifyBlock will extract type/id cleanly via regex
										postAction(
											"updateComponent",
											{
												componentId: comp.id,
												config: JSON.stringify({
													...comp.config,
													embedUri: raw,
													embedType,
												}),
											},
											"Spotify updated",
										);
									}}
								/>
								<label
									class="flex items-center gap-2 text-xs text-gray-500"
								>
									<input
										type="checkbox"
										checked={comp.config?.compact === true}
										onchange={(e) => {
											postAction(
												"updateComponent",
												{
													componentId: comp.id,
													config: JSON.stringify({
														...comp.config,
														compact: (
															e.target as HTMLInputElement
														).checked,
													}),
												},
												"Updated",
											);
										}}
										class="w-4 h-4 rounded border-gray-300 text-indigo-600"
									/>
									Compact mode
								</label>
							</div>
						{:else if comp.type === "text"}
							<div class="px-3 pb-3 space-y-2">
								<label
									class="text-[10px] font-semibold uppercase tracking-wider text-gray-400"
								>
									Text content
								</label>
								<textarea
									value={comp.config?.content ?? ""}
									placeholder="Write something..."
									rows="3"
									class="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-2 resize-y
                    focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
									onchange={(e) => {
										postAction(
											"updateComponent",
											{
												componentId: comp.id,
												config: JSON.stringify({
													...comp.config,
													content: (
														e.target as HTMLTextAreaElement
													).value,
												}),
											},
											"Text updated",
										);
									}}
								></textarea>
								<div class="flex gap-1.5">
									{#each ["left", "center", "right"] as align}
										<button
											onclick={() => {
												postAction(
													"updateComponent",
													{
														componentId: comp.id,
														config: JSON.stringify({
															...comp.config,
															align,
														}),
													},
													"Alignment updated",
												);
											}}
											class="flex-1 text-[10px] font-medium py-1.5 rounded-lg border transition-all
                        {comp.config?.align === align
												? 'border-indigo-500 bg-indigo-50 text-indigo-700'
												: 'border-gray-200 text-gray-500 hover:border-gray-300'}"
										>
											{align.charAt(0).toUpperCase() +
												align.slice(1)}
										</button>
									{/each}
								</div>
							</div>
						{:else if comp.type === "divider"}
							<div class="px-3 pb-3 space-y-2">
								<label
									class="text-[10px] font-semibold uppercase tracking-wider text-gray-400"
								>
									Style
								</label>
								<div class="flex gap-1.5">
									{#each ["line", "dots", "space"] as s}
										<button
											onclick={() => {
												postAction(
													"updateComponent",
													{
														componentId: comp.id,
														config: JSON.stringify({
															...comp.config,
															style: s,
														}),
													},
													"Style updated",
												);
											}}
											class="flex-1 text-[10px] font-medium py-1.5 rounded-lg border transition-all
                        {comp.config?.style === s
												? 'border-indigo-500 bg-indigo-50 text-indigo-700'
												: 'border-gray-200 text-gray-500 hover:border-gray-300'}"
										>
											{s.charAt(0).toUpperCase() +
												s.slice(1)}
										</button>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{:else}
			<div class="flex flex-col items-center py-10 text-center">
				<div
					class="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100
          flex items-center justify-center mb-3 shadow-sm"
				>
					<LayoutGrid class="w-7 h-7 text-gray-300" />
				</div>
				<p class="text-sm font-medium text-gray-500 mb-1">
					No components yet
				</p>
				<p class="text-xs text-gray-400">
					Add your first component below
				</p>
			</div>
		{/each}
	</div>

	<!-- Add component button -->
	<button
		onclick={() => {
			if (canAddComponent) showAddModal = true;
			else goto("/app/billing");
		}}
		class="add-component-btn group w-full flex items-center justify-center gap-2.5
      py-3.5 px-4 rounded-2xl text-sm font-semibold
      text-gray-400 hover:text-indigo-600
      bg-white hover:bg-indigo-50/50
      border-2 border-dashed border-gray-200 hover:border-indigo-300
      shadow-sm hover:shadow-md hover:shadow-indigo-50
      transition-all duration-200 active:scale-[0.98]"
	>
		<div
			class="w-7 h-7 rounded-xl bg-gray-100 group-hover:bg-indigo-100
      flex items-center justify-center transition-colors duration-200"
		>
			<Plus class="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-transform duration-200 group-hover:rotate-90" />
		</div>
		{canAddComponent ? "Add component" : "Upgrade to add more"}
	</button>
</PanelShell>

<!-- Add Component Modal -->
<Modal
	open={showAddModal}
	onclose={() => {
		showAddModal = false;
	}}
	title="Add component"
>
	<div class="grid grid-cols-1 gap-2">
		{#each Object.entries(COMPONENT_TYPE_META) as [type, meta]}
			<button
				onclick={() => addComponent(type as ComponentType)}
				class="flex items-center gap-3 p-3 rounded-xl border border-gray-200
          hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-left
          active:scale-[0.98]"
			>
				<span class="shrink-0 text-indigo-500 bg-indigo-50 rounded-lg p-2">
					<svelte:component this={meta.icon} class="w-5 h-5" />
				</span>
				<div>
					<p class="text-sm font-semibold text-gray-800">
						{meta.label}
					</p>
					<p class="text-xs text-gray-500">{meta.desc}</p>
				</div>
			</button>
		{/each}
	</div>
</Modal>

<!-- Add Link Modal -->
<Modal open={addToCompId !== null} onclose={resetAddForm} title="Add link">
	<form
		method="POST"
		action="?/addLink"
		onsubmit={(e) => {
			e.preventDefault();
			const fd = new FormData(e.target as HTMLFormElement);
			fetch("/app?/addLink", { method: "POST", body: fd }).then(() => {
				resetAddForm();
				invalidateAll();
				studio.showToast("Link added");
			});
		}}
	>
		{#if addToCompId}
			<input type="hidden" name="componentId" value={addToCompId} />
		{/if}
		<div class="space-y-4">
			<Input
				name="title"
				label="Title"
				placeholder="My Website"
				bind:value={newTitle}
				required
			/>
			<Input
				name="url"
				label="URL"
				type="url"
				placeholder="https://example.com"
				bind:value={newUrl}
				required
			/>
			<Input
				name="subtitle"
				label="Subtitle (optional)"
				placeholder="Check out my site"
				bind:value={newSubtitle}
			/>
			<Button type="submit" variant="primary" class="w-full"
				>Add link</Button
			>
		</div>
	</form>
</Modal>

<!-- Edit Link Modal -->
<Modal
	open={editingLink !== null}
	onclose={() => {
		editingLink = null;
	}}
	title="Edit link"
>
	{#if editingLink}
		<form
			method="POST"
			action="?/updateLink"
			onsubmit={(e) => {
				e.preventDefault();
				const fd = new FormData(e.target as HTMLFormElement);
				fetch("/app?/updateLink", { method: "POST", body: fd }).then(
					() => {
						editingLink = null;
						invalidateAll();
						studio.showToast("Link updated");
					},
				);
			}}
		>
			<input type="hidden" name="linkId" value={editingLink.id} />
			<div class="space-y-4">
				<Input
					name="title"
					label="Title"
					bind:value={editTitle}
					required
				/>
				<Input
					name="url"
					label="URL"
					type="url"
					bind:value={editUrl}
					required
				/>
				<Input
					name="subtitle"
					label="Subtitle"
					bind:value={editSubtitle}
				/>
				{#if isPro}
					<Input
						name="startAt"
						label="Start at"
						type="datetime-local"
						bind:value={editStartAt}
					/>
					<Input
						name="endAt"
						label="End at"
						type="datetime-local"
						bind:value={editEndAt}
					/>
					<label class="flex items-center gap-2 text-sm">
						<input
							type="checkbox"
							name="highlight"
							bind:checked={editHighlight}
							class="w-4 h-4 rounded border-gray-300 text-indigo-600"
						/>
						Highlight this link
					</label>
				{:else}
					<p class="text-xs text-gray-400">
						Scheduling and highlights are Pro features.
						<a href="/app/billing" class="text-indigo-600 underline"
							>Upgrade</a
						>
					</p>
				{/if}
				<Button type="submit" variant="primary" class="w-full"
					>Save changes</Button
				>
			</div>
		</form>
	{/if}
</Modal>

<style>
	.section-card {
		animation: section-enter 0.2s ease-out;
	}
	@keyframes section-enter {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.add-component-btn:hover {
		background-image: radial-gradient(
			ellipse at center,
			rgba(99, 102, 241, 0.04) 0%,
			transparent 70%
		);
	}
	.add-link-btn:hover {
		background-image: radial-gradient(
			ellipse at center,
			rgba(99, 102, 241, 0.06) 0%,
			transparent 70%
		);
	}
	.action-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 11px;
		font-weight: 500;
		color: #6b7280;
		background: white;
		padding: 0.25rem 0.625rem;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
		box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
		transition: all 0.15s;
		cursor: pointer;
	}
	.action-chip:hover {
		color: #4f46e5;
		background: #eef2ff;
		border-color: #c7d2fe;
	}
	.action-chip-danger:hover {
		color: #dc2626;
		background: #fef2f2;
		border-color: #fecaca;
	}
</style>
