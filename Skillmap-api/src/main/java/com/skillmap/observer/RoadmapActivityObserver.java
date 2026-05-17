package com.skillmap.observer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class RoadmapActivityObserver implements RoadmapObserver {

	private static final Logger logger = LoggerFactory.getLogger(RoadmapActivityObserver.class);
	private final List<RoadmapEvent> recentEvents = new CopyOnWriteArrayList<>();

	@Override
	public void update(RoadmapEvent event) {
		recentEvents.add(0, event);
		if (recentEvents.size() > 25) {
			recentEvents.remove(recentEvents.size() - 1);
		}
		logger.info("Roadmap activity recorded: type={}, roadmapId={}, title={}",
				event.type(), event.roadmapId(), event.title());
	}

	public List<RoadmapEvent> recentEvents() {
		return List.copyOf(recentEvents);
	}
}
