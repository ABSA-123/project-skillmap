package com.skillmap.observer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class RoadmapAuditObserver implements RoadmapObserver {

	private static final Logger logger = LoggerFactory.getLogger(RoadmapAuditObserver.class);

	@Override
	public void update(RoadmapEvent event) {
		logger.info(
				"Roadmap audit event: type={}, roadmapId={}, targetRole={}, totalItems={}, progress={}%",
				event.type(),
				event.roadmapId(),
				event.targetRole(),
				event.totalItems(),
				event.progressPercentage()
		);
	}
}
