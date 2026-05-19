package com.skillmap.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillmap.exception.InvalidRoadmapRequestException;
import com.skillmap.model.*;
import com.skillmap.service.RoadmapService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CustomRoadmapController.class)
class CustomRoadmapControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RoadmapService roadmapService;

    private CustomRoadmapRequest validRequest() {
        return new CustomRoadmapRequest(
                "test-id",
                "Backend Path",
                "IT",
                "Software Engineering",
                "Backend Developer",
                List.of(new ChecklistItem("Spring Boot", "skill", false)),
                null,
                null,
                null
        );
    }

    private CustomRoadmapResponse sampleResponse() {
        return new CustomRoadmapResponse(
                "test-id",
                "Backend Path",
                "IT",
                "Software Engineering",
                "Backend Developer",
                List.of(new ChecklistItem("Spring Boot", "skill", false)),
                List.of(),
                List.of(),
                List.of(),
                0,
                Instant.now()
        );
    }

    @Test
    void createRoadmap_validRequest_returns200() throws Exception {
        when(roadmapService.createCustomRoadmap(any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/roadmaps")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Backend Path"))
                .andExpect(jsonPath("$.id").value("test-id"))
                .andExpect(jsonPath("$.targetRole").value("Backend Developer"));
    }

    @Test
    void createRoadmap_serviceThrowsInvalidRequest_returns400() throws Exception {
        when(roadmapService.createCustomRoadmap(any()))
                .thenThrow(new InvalidRoadmapRequestException("Roadmap title is required."));

        CustomRoadmapRequest badRequest = new CustomRoadmapRequest(
                null, null, "IT", "Software Engineering", "Developer",
                List.of(new ChecklistItem("React", "skill", false)),
                null, null, null
        );

        mockMvc.perform(post("/roadmaps")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Roadmap title is required."));
    }

    @Test
    void createRoadmap_responseContainsProgressPercentage() throws Exception {
        when(roadmapService.createCustomRoadmap(any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/roadmaps")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.progressPercentage").value(0));
    }

    @Test
    void createRoadmap_emptyBody_returns400() throws Exception {
        when(roadmapService.createCustomRoadmap(any()))
                .thenThrow(new InvalidRoadmapRequestException("Roadmap title is required."));

        mockMvc.perform(post("/roadmaps")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Roadmap title is required."));
    }
}
