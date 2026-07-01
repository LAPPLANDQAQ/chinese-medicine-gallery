import { historyTimelineData } from "./historyData.js";

/**
 * Flatten the 4-era structure into 20 individual image items.
 * Each item carries the parent era context for filtering and detail display.
 */
export const imageItems = historyTimelineData.flatMap((era) =>
  era.images.map((image) => ({
    imageId: image.id,
    src: image.src,
    title: image.title,
    caption: image.caption,
    description: image.description || "",
    eraId: era.id,
    period: era.period,
    timeSpan: era.timeSpan,
    eraTitle: era.title,
    eraSummary: era.summary,
    textSections: era.textSections
  }))
);

export const IMAGE_COUNT = imageItems.length;
