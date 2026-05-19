package com.skillmap.controller;

import com.skillmap.model.*;
import com.skillmap.service.RoadmapService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RoadmapController.class)
class RoadmapControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RoadmapService roadmapService;

    private RoadmapData sampleData() {
        return new RoadmapData(
                "Frontend Developer Roadmap",
                "IT",
                "Software Engineering",
                "Frontend Development",
                List.of(new ChecklistItem("React", "skill", false)),
                List.of(new ChecklistItem("Meta Certificate", "certification", false)),
                List.of(new WeeklyTask(1, "Fundamentals", "HTML & CSS", false))
        );
    }

    @Test
    void getRoadmap_validParams_returns200() throws Exception {
        when(roadmapService.generate(any()))
                .thenReturn(sampleData());

        mockMvc.perform(get("/roadmap")
                        .param("field", "IT")
                        .param("track", "Software Engineering")
                        .param("specialization", "frontend"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Frontend Developer Roadmap"))
                .andExpect(jsonPath("$.skills").isArray())
                .andExpect(jsonPath("$.certifications").isArray());
    }

    @Test
    void getRoadmap_missingRequiredParam_returns400() throws Exception {
        mockMvc.perform(get("/roadmap")
                        .param("field", "IT")
                        .param("track", "Software Engineering"))
                // missing specialization
                .andExpect(status().isBadRequest());
    }

    @Test
    void getRoadmap_invalidSpecialization_returns400() throws Exception {
        when(roadmapService.generate(any()))
                .thenThrow(new com.skillmap.exception.InvalidRoadmapRequestException("Invalid specialization."));

        mockMvc.perform(get("/roadmap")
                        .param("field", "IT")
                        .param("track", "Software Engineering")
                        .param("specialization", "gaming"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid specialization."));
    }

    @Test
    void getRoadmap_responseContainsWeeklyTasks() throws Exception {
        when(roadmapService.generate(any()))
                .thenReturn(sampleData());

        mockMvc.perform(get("/roadmap")
                        .param("field", "IT")
                        .param("track", "Software Engineering")
                        .param("specialization", "frontend"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.weeklyTasks").isArray())
                .andExpect(jsonPath("$.weeklyTasks[0].title").value("Fundamentals"));
    }
}
