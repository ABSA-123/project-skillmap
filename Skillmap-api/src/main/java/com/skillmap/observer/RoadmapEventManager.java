package com.skillmap.observer;

import com.skillmap.model.CustomRoadmap;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class RoadmapEventManager implements RoadmapSubject {

	private final List<RoadmapObserver> observers = new CopyOnWriteArrayList<>();

	public RoadmapEventManager(List<RoadmapObserver> observers) {
		this.observers.addAll(observers);
	}

	@Override
	public void attach(RoadmapObserver observer) {
		observers.add(observer);
	}

	@Override
	public void detach(RoadmapObserver observer) {
		observers.remove(observer);
	}

	@Override
	public void notifyObservers(RoadmapEvent event) {
		observers.forEach(observer -> observer.update(event));
	}

	public void publishCustomRoadmapCreated(CustomRoadmap roadmap) {
		notifyObservers(new RoadmapEvent(
				RoadmapEventType.CUSTOM_ROADMAP_CREATED,
				roadmap.id(),
				roadmap.title(),
				roadmap.targetRole(),
				roadmap.skills().size() + roadmap.certifications().size() + roadmap.weeklyTasks().size(),
				roadmap.progressPercentage(),
				Instant.now()
		));
	}
}
