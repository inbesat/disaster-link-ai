package com.safesphere.nativeapp.data.entity;

import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "reports")
public class ReportEntity {
    @PrimaryKey
    public String id;
    public double lat;
    public double lng;
    public String reportType; // flooding, road_blocked, shelter_needed, rescue, other
    public String source; // social, sms, app, web
    public String rawText;
    public int severity; // 0-100
    public double confidenceScore;
    public String verificationStatus; // unverified, verified, rejected
    public boolean peopleTrapped;
    public int peopleCount;
    public String locations; // JSON array of location names
    public String summary;
    public boolean isPwd;
    public String pwdDetails;
    public String createdAt;
    public String updatedAt;
}