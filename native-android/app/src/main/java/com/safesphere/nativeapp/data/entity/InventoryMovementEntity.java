package com.safesphere.nativeapp.data.entity;

import androidx.room.Entity;
import androidx.annotation.NonNull;
import androidx.room.PrimaryKey;

@Entity(tableName = "inventory_movements")
public class InventoryMovementEntity {
    @PrimaryKey
        @NonNull public String id;
    public String resourceId;
    public String fromDepot;
    public String toDepot;
    public int quantity;
    public String timestamp;
    public String status; // pending, completed, failed
}