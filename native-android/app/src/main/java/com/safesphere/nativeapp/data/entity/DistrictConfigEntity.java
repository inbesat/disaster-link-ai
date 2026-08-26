package com.safesphere.nativeapp.data.entity;

import androidx.room.Entity;
import androidx.annotation.NonNull;
import androidx.room.PrimaryKey;

@Entity(tableName = "district_configs")
public class DistrictConfigEntity {
    @PrimaryKey
        @NonNull public String district;
    public double floodThreshold;
    public double warningThreshold;
    public double criticalThreshold;
    public String updatedAt;
}