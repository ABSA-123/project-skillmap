package com.skillmap.factory;

import com.skillmap.exception.InvalidRoadmapRequestException;
import com.skillmap.model.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.*;

class RoadmapFactoryTest {

    private static final String VALID_FIELD = "IT";
    private static final String VALID_TRACK = "Software Engineering";

    @ParameterizedTest
    @ValueSource(strings = {"frontend", "frontend development"})
    void createRoadmap_frontend_returnsFrontendRoadmap(String spec) {
        RoadmapRequest request = new RoadmapRequest(VALID_FIELD, VALID_TRACK, spec);
        Roadmap result = RoadmapFactory.createRoadmap(request);
        assertThat(result).isInstanceOf(FrontendRoadmap.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {"backend", "backend development"})
    void createRoadmap_backend_returnsBackendRoadmap(String spec) {
        RoadmapRequest request = new RoadmapRequest(VALID_FIELD, VALID_TRACK, spec);
        Roadmap result = RoadmapFactory.createRoadmap(request);
        assertThat(result).isInstanceOf(BackendRoadmap.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {"mobile", "mobile development", "mobile programmer"})
    void createRoadmap_mobile_returnsMobileRoadmap(String spec) {
        RoadmapRequest request = new RoadmapRequest(VALID_FIELD, VALID_TRACK, spec);
        Roadmap result = RoadmapFactory.createRoadmap(request);
        assertThat(result).isInstanceOf(MobileRoadmap.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {"cloud", "cloud engineering", "cloud infrastructure"})
    void createRoadmap_cloud_returnsCloudRoadmap(String spec) {
        RoadmapRequest request = new RoadmapRequest(VALID_FIELD, VALID_TRACK, spec);
        Roadmap result = RoadmapFactory.createRoadmap(request);
        assertThat(result).isInstanceOf(CloudEngRoadmap.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {"cybersecurity", "security", "cyber security"})
    void createRoadmap_cybersecurity_returnsCybersecurityRoadmap(String spec) {
        RoadmapRequest request = new RoadmapRequest(VALID_FIELD, VALID_TRACK, spec);
        Roadmap result = RoadmapFactory.createRoadmap(request);
        assertThat(result).isInstanceOf(CybersecurityRoadmap.class);
    }

    @Test
    void createRoadmap_ai_returnsAIRoadmap() {
        RoadmapRequest request = new RoadmapRequest(VALID_FIELD, VALID_TRACK, "ai");
        Roadmap result = RoadmapFactory.createRoadmap(request);
        assertThat(result).isInstanceOf(AIRoadmap.class);
    }

    @Test
    void createRoadmap_normalizesInputCaseInsensitively() {
        RoadmapRequest request = new RoadmapRequest("  IT  ", "  Software Engineering  ", "  FRONTEND  ");
        Roadmap result = RoadmapFactory.createRoadmap(request);
        assertThat(result).isInstanceOf(FrontendRoadmap.class);
    }

    @Test
    void createRoadmap_invalidField_throwsException() {
        RoadmapRequest request = new RoadmapRequest("business", VALID_TRACK, "frontend");
        assertThatThrownBy(() -> RoadmapFactory.createRoadmap(request))
                .isInstanceOf(InvalidRoadmapRequestException.class)
                .hasMessageContaining("Only IT");
    }

    @Test
    void createRoadmap_invalidTrack_throwsException() {
        RoadmapRequest request = new RoadmapRequest(VALID_FIELD, "data science", "frontend");
        assertThatThrownBy(() -> RoadmapFactory.createRoadmap(request))
                .isInstanceOf(InvalidRoadmapRequestException.class);
    }

    @Test
    void createRoadmap_unknownSpecialization_throwsException() {
        RoadmapRequest request = new RoadmapRequest(VALID_FIELD, VALID_TRACK, "gaming");
        assertThatThrownBy(() -> RoadmapFactory.createRoadmap(request))
                .isInstanceOf(InvalidRoadmapRequestException.class)
                .hasMessageContaining("Invalid specialization");
    }

    @Test
    void createRoadmap_blankSpecialization_throwsException() {
        RoadmapRequest request = new RoadmapRequest(VALID_FIELD, VALID_TRACK, "   ");
        assertThatThrownBy(() -> RoadmapFactory.createRoadmap(request))
                .isInstanceOf(InvalidRoadmapRequestException.class);
    }

    @Test
    void createRoadmap_nullField_throwsException() {
        RoadmapRequest request = new RoadmapRequest(null, VALID_TRACK, "frontend");
        assertThatThrownBy(() -> RoadmapFactory.createRoadmap(request))
                .isInstanceOf(InvalidRoadmapRequestException.class);
    }
}
