package com.skillmap.observer;

public interface RoadmapSubject {
	void attach(RoadmapObserver observer);

	void detach(RoadmapObserver observer);

	void notifyObservers(RoadmapEvent event);
}
