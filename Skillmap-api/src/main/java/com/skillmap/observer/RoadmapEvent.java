package com.skillmap.observer;

import java.time.Instant;

public record RoadmapEvent(
		RoadmapEventType type,
		String roadmapId,
		String title,
		String targetRole,
		int totalItems,
		int progressPercentage,
		Instant occurredAt
) {
}
