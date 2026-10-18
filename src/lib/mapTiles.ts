export type TileAvailability = { loaded: number; failed: number; status: "loading" | "ready" | "unavailable" };

export const initialTileAvailability: TileAvailability = { loaded: 0, failed: 0, status: "loading" };

/** A failed tile is not a failed basemap if another tile loads successfully. */
export function advanceTileAvailability(state: TileAvailability, event: "load" | "error" | "timeout"): TileAvailability {
  const loaded = state.loaded + Number(event === "load");
  const failed = state.failed + Number(event === "error");
  return {
    loaded,
    failed,
    status: loaded > 0 ? "ready" : event === "timeout" || failed >= 3 ? "unavailable" : "loading",
  };
}
