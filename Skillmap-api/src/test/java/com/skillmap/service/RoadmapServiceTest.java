package com.skillmap.service;

import com.skillmap.exception.InvalidRoadmapRequestException;
import com.skillmap.model.*;
import com.skillmap.observer.RoadmapEventManager;
import com.skillmap.repository.RoadmapRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoadmapServiceTest {

    @Mock
    private RoadmapRepository roadmapRepository;

    @Mock
    private RoadmapEventManager roadmapEventManager;

    private RoadmapService service;

    @BeforeEach
    void setUp() {
        service = new RoadmapService(roadmapRepository, roadmapEventManager);
    }

    // --- generate() ---

    @Test
    void generate_validFrontendRequest_returnsRoadmapData() {
        RoadmapRequest request = new RoadmapRequest("IT", "Software Engineering", "frontend");
        RoadmapData data = service.generate(request);

        assertThat(data).isNotNull();
        assertThat(data.title()).contains("Frontend");
        assertThat(data.skills()).isNotEmpty();
        assertThat(data.certifications()).isNotEmpty();
        assertThat(data.weeklyTasks()).isNotEmpty();
    }

    @Test
    void generate_validBackendRequest_returnsRoadmapData() {
        RoadmapRequest request = new RoadmapRequest("IT", "Software Engineering", "backend");
        RoadmapData data = service.generate(request);

        assertThat(data).isNotNull();
        assertThat(data.title()).contains("Backend");
    }

    @Test
    void generate_invalidSpecialization_throwsException() {
        RoadmapRequest request = new RoadmapRequest("IT", "Software Engineering", "unknown");

        assertThatThrownBy(() -> service.generate(request))
                .isInstanceOf(InvalidRoadmapRequestException.class);
    }

    // --- createCustomRoadmap() ---

    @Test
    void createCustomRoadmap_savesToRepository() {
        CustomRoadmapRequest request = new CustomRoadmapRequest(
                null,
                "My Roadmap",
                "IT",
                "Software Engineering",
                "Backend Developer",
                List.of(new ChecklistItem("Spring Boot", "skill", false)),
                null,
                null,
                null
        );

        service.createCustomRoadmap(request);

        verify(roadmapRepository, times(1)).save(any());
    }

    @Test
    void createCustomRoadmap_publishesEvent() {
        CustomRoadmapRequest request = new CustomRoadmapRequest(
                null,
                "Event Roadmap",
                "IT",
                "Software Engineering",
                "Developer",
                List.of(new ChecklistItem("Docker", "skill", false)),
                null,
                null,
                null
        );

        service.createCustomRoadmap(request);

        verify(roadmapEventManager, times(1)).publishCustomRoadmapCreated(any());
    }

    @Test
    void createCustomRoadmap_returnsResponseWithCorrectTitle() {
        CustomRoadmapRequest request = new CustomRoadmapRequest(
                "test-id",
                "My Career Path",
                "IT",
                "Software Engineering",
                "Full Stack Developer",
                List.of(new ChecklistItem("React", "skill", false)),
                null,
                null,
                null
        );

        CustomRoadmapResponse response = service.createCustomRoadmap(request);

        assertThat(response.title()).isEqualTo("My Career Path");
        assertThat(response.id()).isEqualTo("test-id");
        assertThat(response.skills()).hasSize(1);
    }

    @Test
    void createCustomRoadmap_noSkillsNoCerts_throwsBeforeSaving() {
        CustomRoadmapRequest request = new CustomRoadmapRequest(
                null,
                "Empty Roadmap",
                "IT",
                "Software Engineering",
                "Developer",
                null,
                null,
                null,
                null
        );

        assertThatThrownBy(() -> service.createCustomRoadmap(request))
                .isInstanceOf(InvalidRoadmapRequestException.class);

        verifyNoInteractions(roadmapRepository);
        verifyNoInteractions(roadmapEventManager);
    }

    @Test
    void createCustomRoadmap_withResourcesAndTasks_savedCorrectly() {
        CustomRoadmapRequest request = new CustomRoadmapRequest(
                null,
                "Full Roadmap",
                "IT",
                "Software Engineering",
                "Cloud Engineer",
                List.of(new ChecklistItem("AWS", "skill", false)),
                List.of(new ChecklistItem("AWS SAA", "certification", false)),
                List.of(new WeeklyTask(1, "Intro to AWS", "Study EC2 and S3", false)),
                List.of(new RoadmapResource("AWS Docs", "link", "https://docs.aws.amazon.com"))
        );

        CustomRoadmapResponse response = service.createCustomRoadmap(request);

        assertThat(response.skills()).hasSize(1);
        assertThat(response.certifications()).hasSize(1);
        assertThat(response.weeklyTasks()).hasSize(1);
        assertThat(response.resources()).hasSize(1);
    }
}
