package com.skillmap.service;

import com.skillmap.entity.*;
import com.skillmap.factory.RoadmapFactory;
import com.skillmap.model.*;
import com.skillmap.observer.RoadmapEventManager;
import com.skillmap.repository.RoadmapRepository;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
public class RoadmapService {

	private final RoadmapRepository roadmapRepository;
	private final RoadmapEventManager roadmapEventManager;

	public RoadmapService(RoadmapRepository roadmapRepository, RoadmapEventManager roadmapEventManager) {
		this.roadmapRepository = roadmapRepository;
		this.roadmapEventManager = roadmapEventManager;
	}

	public RoadmapData generate(RoadmapRequest request) {
		Roadmap roadmap = RoadmapFactory.createRoadmap(request);
		return roadmap.generateRoadmap();
	}

	public CustomRoadmapResponse createCustomRoadmap(CustomRoadmapRequest request) {
		CustomRoadmap.Builder builder = CustomRoadmap.builder()
				.withId(request.id())
				.withTitle(request.title())
				.withField(request.field())
				.withTrack(request.track())
				.withTargetRole(request.targetRole());

		if (request.skills() != null) {
			for (ChecklistItem skill : request.skills()) {
				builder.addSkill(skill);
			}
		}
		if (request.certifications() != null) {
			for (ChecklistItem certification : request.certifications()) {
				builder.addCertification(certification);
			}
		}
		if (request.weeklyTasks() != null) {
			for (WeeklyTask task : request.weeklyTasks()) {
				builder.addWeeklyTask(task);
			}
		}
		if (request.resources() != null) {
			for (RoadmapResource resource : request.resources()) {
				builder.addResource(resource);
			}
		}

		CustomRoadmap roadmap = builder.build();

		// Save to DB
		RoadmapEntity entity = new RoadmapEntity();
		entity.setId(roadmap.id());
		entity.setTitle(roadmap.title());
		entity.setField(roadmap.field());
		entity.setTrack(roadmap.track());
		entity.setTargetRole(roadmap.targetRole());
		entity.setCreatedAt(roadmap.createdAt());

		entity.setSkills(roadmap.skills().stream().map(this::mapChecklist).collect(Collectors.toList()));
		entity.setCertifications(roadmap.certifications().stream().map(this::mapChecklist).collect(Collectors.toList()));
		entity.setWeeklyTasks(roadmap.weeklyTasks().stream().map(this::mapTask).collect(Collectors.toList()));
		entity.setResources(roadmap.resources().stream().map(this::mapResource).collect(Collectors.toList()));

		roadmapRepository.save(entity);
		roadmapEventManager.publishCustomRoadmapCreated(roadmap);

		return CustomRoadmapResponse.from(roadmap);
	}

	private ChecklistItemEntity mapChecklist(ChecklistItem item) {
		ChecklistItemEntity e = new ChecklistItemEntity();
		e.setName(item.name());
		e.setCategory(item.category());
		e.setCompleted(item.completed());
		return e;
	}

	private WeeklyTaskEntity mapTask(WeeklyTask task) {
		WeeklyTaskEntity e = new WeeklyTaskEntity();
		e.setWeek(task.week());
		e.setTitle(task.title());
		e.setDescription(task.description());
		e.setCompleted(task.completed());
		return e;
	}

	private ResourceEntity mapResource(RoadmapResource res) {
		ResourceEntity e = new ResourceEntity();
		e.setName(res.name());
		e.setType(res.type());
		e.setReference(res.reference());
		return e;
	}
}
