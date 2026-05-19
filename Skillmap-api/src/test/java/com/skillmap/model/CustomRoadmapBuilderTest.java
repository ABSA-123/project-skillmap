package com.skillmap.model;

import com.skillmap.exception.InvalidRoadmapRequestException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class CustomRoadmapBuilderTest {

    private CustomRoadmap.Builder validBuilder() {
        return CustomRoadmap.builder()
                .withTitle("My Roadmap")
                .withField("IT")
                .withTrack("Software Engineering")
                .withTargetRole("Frontend Developer")
                .addSkill(new ChecklistItem("React", "skill", false));
    }

    @Test
    void build_validRoadmap_setsAllFields() {
        CustomRoadmap roadmap = validBuilder().build();

        assertThat(roadmap.title()).isEqualTo("My Roadmap");
        assertThat(roadmap.field()).isEqualTo("IT");
        assertThat(roadmap.track()).isEqualTo("Software Engineering");
        assertThat(roadmap.targetRole()).isEqualTo("Frontend Developer");
        assertThat(roadmap.skills()).hasSize(1);
        assertThat(roadmap.id()).isNotBlank();
        assertThat(roadmap.createdAt()).isNotNull();
    }

    @Test
    void build_withCustomId_usesProvidedId() {
        CustomRoadmap roadmap = validBuilder().withId("custom-id-123").build();
        assertThat(roadmap.id()).isEqualTo("custom-id-123");
    }

    @Test
    void build_withBlankId_generatesUUID() {
        CustomRoadmap roadmap = validBuilder().withId("   ").build();
        assertThat(roadmap.id()).isNotEqualTo("   ").isNotBlank();
    }

    @Test
    void build_missingTitle_throwsException() {
        assertThatThrownBy(() ->
                CustomRoadmap.builder()
                        .withField("IT")
                        .withTrack("Software Engineering")
                        .withTargetRole("Developer")
                        .addSkill(new ChecklistItem("Java", "skill", false))
                        .build()
        ).isInstanceOf(InvalidRoadmapRequestException.class)
                .hasMessageContaining("title");
    }

    @Test
    void build_missingField_throwsException() {
        assertThatThrownBy(() ->
                CustomRoadmap.builder()
                        .withTitle("Roadmap")
                        .withTrack("Software Engineering")
                        .withTargetRole("Developer")
                        .addSkill(new ChecklistItem("Java", "skill", false))
                        .build()
        ).isInstanceOf(InvalidRoadmapRequestException.class)
                .hasMessageContaining("Field");
    }

    @Test
    void build_missingTrack_throwsException() {
        assertThatThrownBy(() ->
                CustomRoadmap.builder()
                        .withTitle("Roadmap")
                        .withField("IT")
                        .withTargetRole("Developer")
                        .addSkill(new ChecklistItem("Java", "skill", false))
                        .build()
        ).isInstanceOf(InvalidRoadmapRequestException.class)
                .hasMessageContaining("Track");
    }

    @Test
    void build_missingTargetRole_throwsException() {
        assertThatThrownBy(() ->
                CustomRoadmap.builder()
                        .withTitle("Roadmap")
                        .withField("IT")
                        .withTrack("Software Engineering")
                        .addSkill(new ChecklistItem("Java", "skill", false))
                        .build()
        ).isInstanceOf(InvalidRoadmapRequestException.class)
                .hasMessageContaining("Target role");
    }

    @Test
    void build_noSkillsNoCertsNoTasks_throwsException() {
        assertThatThrownBy(() ->
                CustomRoadmap.builder()
                        .withTitle("Roadmap")
                        .withField("IT")
                        .withTrack("Software Engineering")
                        .withTargetRole("Developer")
                        .build()
        ).isInstanceOf(InvalidRoadmapRequestException.class)
                .hasMessageContaining("at least one");
    }

    @Test
    void build_nullSkillIgnored() {
        assertThatThrownBy(() ->
                CustomRoadmap.builder()
                        .withTitle("Roadmap")
                        .withField("IT")
                        .withTrack("Software Engineering")
                        .withTargetRole("Developer")
                        .addSkill(null)
                        .build()
        ).isInstanceOf(InvalidRoadmapRequestException.class);
    }

    @Test
    void build_blankSkillNameIgnored() {
        assertThatThrownBy(() ->
                CustomRoadmap.builder()
                        .withTitle("Roadmap")
                        .withField("IT")
                        .withTrack("Software Engineering")
                        .withTargetRole("Developer")
                        .addSkill(new ChecklistItem("   ", "skill", false))
                        .build()
        ).isInstanceOf(InvalidRoadmapRequestException.class);
    }

    @Test
    void build_skillNameTrimmed() {
        CustomRoadmap roadmap = validBuilder()
                .addSkill(new ChecklistItem("  Docker  ", "skill", false))
                .build();
        assertThat(roadmap.skills())
                .extracting(ChecklistItem::name)
                .contains("Docker");
    }

    @Test
    void build_certificationOnly_accepted() {
        CustomRoadmap roadmap = CustomRoadmap.builder()
                .withTitle("Roadmap")
                .withField("IT")
                .withTrack("Software Engineering")
                .withTargetRole("Developer")
                .addCertification(new ChecklistItem("AWS Certified", "certification", false))
                .build();

        assertThat(roadmap.certifications()).hasSize(1);
        assertThat(roadmap.skills()).isEmpty();
    }

    @Test
    void build_weeklyTaskOnly_accepted() {
        CustomRoadmap roadmap = CustomRoadmap.builder()
                .withTitle("Roadmap")
                .withField("IT")
                .withTrack("Software Engineering")
                .withTargetRole("Developer")
                .addWeeklyTask(new WeeklyTask(1, "Intro", "Get started", false))
                .build();

        assertThat(roadmap.weeklyTasks()).hasSize(1);
    }

    @Test
    void build_weeklyTaskWithZeroWeek_ignored() {
        assertThatThrownBy(() ->
                CustomRoadmap.builder()
                        .withTitle("Roadmap")
                        .withField("IT")
                        .withTrack("Software Engineering")
                        .withTargetRole("Developer")
                        .addWeeklyTask(new WeeklyTask(0, "Invalid", "desc", false))
                        .build()
        ).isInstanceOf(InvalidRoadmapRequestException.class);
    }
}
