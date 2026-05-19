package com.skillmap.model;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class CustomRoadmapProgressTest {

    private CustomRoadmap.Builder baseBuilder() {
        return CustomRoadmap.builder()
                .withTitle("Progress Test")
                .withField("IT")
                .withTrack("Software Engineering")
                .withTargetRole("Developer");
    }

    @Test
    void progressPercentage_noItems_returnsZero() {
        CustomRoadmap roadmap = baseBuilder()
                .addSkill(new ChecklistItem("React", "skill", false))
                .build();

        // one skill, none completed
        assertThat(roadmap.progressPercentage()).isZero();
    }

    @Test
    void progressPercentage_allSkillsCompleted_returns100() {
        CustomRoadmap roadmap = baseBuilder()
                .addSkill(new ChecklistItem("React", "skill", true))
                .addSkill(new ChecklistItem("TypeScript", "skill", true))
                .build();

        assertThat(roadmap.progressPercentage()).isEqualTo(100);
    }

    @Test
    void progressPercentage_halfCompleted_returns50() {
        CustomRoadmap roadmap = baseBuilder()
                .addSkill(new ChecklistItem("React", "skill", true))
                .addSkill(new ChecklistItem("TypeScript", "skill", false))
                .build();

        assertThat(roadmap.progressPercentage()).isEqualTo(50);
    }

    @Test
    void progressPercentage_mixedSkillsAndTasks() {
        CustomRoadmap roadmap = baseBuilder()
                .addSkill(new ChecklistItem("React", "skill", true))   // completed
                .addSkill(new ChecklistItem("Node", "skill", false))    // not
                .addWeeklyTask(new WeeklyTask(1, "Week 1", "desc", true))  // completed
                .addWeeklyTask(new WeeklyTask(2, "Week 2", "desc", false)) // not
                .build();

        // 4 total items, 2 completed → 50%
        assertThat(roadmap.progressPercentage()).isEqualTo(50);
    }

    @Test
    void progressPercentage_certificationsNotCountedAsCompleted() {
        // certifications aren't counted in completedCount (only skills + weeklyTasks)
        CustomRoadmap roadmap = baseBuilder()
                .addSkill(new ChecklistItem("React", "skill", false))
                .addCertification(new ChecklistItem("AWS", "certification", true))
                .build();

        // totalItems = 2, completedItems = 0 (cert not counted in numerator)
        assertThat(roadmap.progressPercentage()).isEqualTo(0);
    }
}
