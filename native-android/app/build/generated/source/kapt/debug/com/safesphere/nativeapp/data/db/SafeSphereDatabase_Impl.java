package com.safesphere.nativeapp.data.db;

import androidx.annotation.NonNull;
import androidx.room.DatabaseConfiguration;
import androidx.room.InvalidationTracker;
import androidx.room.RoomDatabase;
import androidx.room.RoomOpenHelper;
import androidx.room.migration.AutoMigrationSpec;
import androidx.room.migration.Migration;
import androidx.room.util.DBUtil;
import androidx.room.util.TableInfo;
import androidx.sqlite.db.SupportSQLiteDatabase;
import androidx.sqlite.db.SupportSQLiteOpenHelper;
import com.safesphere.nativeapp.data.dao.AlertDao;
import com.safesphere.nativeapp.data.dao.AlertDao_Impl;
import com.safesphere.nativeapp.data.dao.AuditLogDao;
import com.safesphere.nativeapp.data.dao.AuditLogDao_Impl;
import com.safesphere.nativeapp.data.dao.DistrictConfigDao;
import com.safesphere.nativeapp.data.dao.DistrictConfigDao_Impl;
import com.safesphere.nativeapp.data.dao.EvacuationDao;
import com.safesphere.nativeapp.data.dao.EvacuationDao_Impl;
import com.safesphere.nativeapp.data.dao.FamilyMemberDao;
import com.safesphere.nativeapp.data.dao.FamilyMemberDao_Impl;
import com.safesphere.nativeapp.data.dao.InventoryMovementDao;
import com.safesphere.nativeapp.data.dao.InventoryMovementDao_Impl;
import com.safesphere.nativeapp.data.dao.KnowledgeDocDao;
import com.safesphere.nativeapp.data.dao.KnowledgeDocDao_Impl;
import com.safesphere.nativeapp.data.dao.ReportDao;
import com.safesphere.nativeapp.data.dao.ReportDao_Impl;
import com.safesphere.nativeapp.data.dao.ResourceDao;
import com.safesphere.nativeapp.data.dao.ResourceDao_Impl;
import com.safesphere.nativeapp.data.dao.RoadClosureDao;
import com.safesphere.nativeapp.data.dao.RoadClosureDao_Impl;
import com.safesphere.nativeapp.data.dao.ShelterDao;
import com.safesphere.nativeapp.data.dao.ShelterDao_Impl;
import com.safesphere.nativeapp.data.dao.SosEventDao;
import com.safesphere.nativeapp.data.dao.SosEventDao_Impl;
import com.safesphere.nativeapp.data.dao.UserDao;
import com.safesphere.nativeapp.data.dao.UserDao_Impl;
import java.lang.Class;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.processing.Generated;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class SafeSphereDatabase_Impl extends SafeSphereDatabase {
  private volatile UserDao _userDao;

  private volatile AlertDao _alertDao;

  private volatile ShelterDao _shelterDao;

  private volatile ResourceDao _resourceDao;

  private volatile EvacuationDao _evacuationDao;

  private volatile ReportDao _reportDao;

  private volatile RoadClosureDao _roadClosureDao;

  private volatile AuditLogDao _auditLogDao;

  private volatile FamilyMemberDao _familyMemberDao;

  private volatile SosEventDao _sosEventDao;

  private volatile KnowledgeDocDao _knowledgeDocDao;

  private volatile InventoryMovementDao _inventoryMovementDao;

  private volatile DistrictConfigDao _districtConfigDao;

  @Override
  @NonNull
  protected SupportSQLiteOpenHelper createOpenHelper(@NonNull final DatabaseConfiguration config) {
    final SupportSQLiteOpenHelper.Callback _openCallback = new RoomOpenHelper(config, new RoomOpenHelper.Delegate(1) {
      @Override
      public void createAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("CREATE TABLE IF NOT EXISTS `users` (`id` TEXT NOT NULL, `email` TEXT, `name` TEXT, `phone` TEXT, `role` TEXT, `organization` TEXT, `assignedDistrict` TEXT, `status` TEXT, `lastActive` TEXT, `avatarUrl` TEXT, `passwordHash` TEXT, `createdAt` TEXT, `updatedAt` TEXT, `guestMode` INTEGER NOT NULL, `pwdPriority` INTEGER NOT NULL, `pwdDetails` TEXT, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `alerts` (`id` TEXT NOT NULL, `district` TEXT, `severity` TEXT, `message` TEXT, `channel` TEXT, `status` TEXT, `acknowledgedBy` TEXT, `acknowledgedAt` TEXT, `createdAt` TEXT, `expiresAt` TEXT, `isDuplicate` INTEGER NOT NULL, `originalAlertId` TEXT, `language` TEXT, `translatedMessage` TEXT, `unacknowledgedCount` INTEGER NOT NULL, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `shelters` (`id` TEXT NOT NULL, `name` TEXT, `district` TEXT, `lat` REAL NOT NULL, `lng` REAL NOT NULL, `capacity` INTEGER NOT NULL, `currentOccupancy` INTEGER NOT NULL, `water` INTEGER NOT NULL, `food` INTEGER NOT NULL, `medical` INTEGER NOT NULL, `electricity` INTEGER NOT NULL, `status` TEXT, `contactPerson` TEXT, `phone` TEXT, `imageUrl` TEXT, `createdAt` TEXT, `updatedAt` TEXT, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `resources` (`id` TEXT NOT NULL, `name` TEXT, `category` TEXT, `quantity` INTEGER NOT NULL, `unit` TEXT, `depotName` TEXT, `lat` REAL NOT NULL, `lng` REAL NOT NULL, `status` TEXT, `createdAt` TEXT, `updatedAt` TEXT, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `evacuations` (`id` TEXT NOT NULL, `villageName` TEXT, `shelterName` TEXT, `evacuees` INTEGER NOT NULL, `routeDurationSec` INTEGER NOT NULL, `status` TEXT, `busesNeeded` INTEGER NOT NULL, `boatsNeeded` INTEGER NOT NULL, `createdAt` TEXT, `updatedAt` TEXT, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `reports` (`id` TEXT NOT NULL, `lat` REAL NOT NULL, `lng` REAL NOT NULL, `reportType` TEXT, `source` TEXT, `rawText` TEXT, `severity` INTEGER NOT NULL, `confidenceScore` REAL NOT NULL, `verificationStatus` TEXT, `peopleTrapped` INTEGER NOT NULL, `peopleCount` INTEGER NOT NULL, `locations` TEXT, `summary` TEXT, `isPwd` INTEGER NOT NULL, `pwdDetails` TEXT, `createdAt` TEXT, `updatedAt` TEXT, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `road_closures` (`id` TEXT NOT NULL, `lat` REAL NOT NULL, `lng` REAL NOT NULL, `roadName` TEXT, `description` TEXT, `active` INTEGER NOT NULL, `createdAt` TEXT, `updatedAt` TEXT, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `audit_logs` (`id` TEXT NOT NULL, `action` TEXT, `actor` TEXT, `resource` TEXT, `ip` TEXT, `severity` TEXT, `timestamp` TEXT, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `family_members` (`id` TEXT NOT NULL, `userId` TEXT, `name` TEXT, `phone` TEXT, `relation` TEXT, `lat` REAL NOT NULL, `lng` REAL NOT NULL, `status` TEXT, `lastSeen` TEXT, `createdAt` TEXT, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `sos_events` (`id` TEXT NOT NULL, `userId` TEXT, `type` TEXT, `lat` REAL NOT NULL, `lng` REAL NOT NULL, `message` TEXT, `status` TEXT, `resolution` TEXT, `createdAt` TEXT, `resolvedAt` TEXT, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `knowledge_docs` (`id` TEXT NOT NULL, `title` TEXT, `district` TEXT, `documentType` TEXT, `content` TEXT, `embedding` TEXT, `createdAt` TEXT, `updatedAt` TEXT, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `inventory_movements` (`id` TEXT NOT NULL, `resourceId` TEXT, `fromDepot` TEXT, `toDepot` TEXT, `quantity` INTEGER NOT NULL, `timestamp` TEXT, `status` TEXT, PRIMARY KEY(`id`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `district_configs` (`district` TEXT NOT NULL, `floodThreshold` REAL NOT NULL, `warningThreshold` REAL NOT NULL, `criticalThreshold` REAL NOT NULL, `updatedAt` TEXT, PRIMARY KEY(`district`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS room_master_table (id INTEGER PRIMARY KEY,identity_hash TEXT)");
        db.execSQL("INSERT OR REPLACE INTO room_master_table (id,identity_hash) VALUES(42, 'f8352df248cbd0a8a18f27f30276da26')");
      }

      @Override
      public void dropAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("DROP TABLE IF EXISTS `users`");
        db.execSQL("DROP TABLE IF EXISTS `alerts`");
        db.execSQL("DROP TABLE IF EXISTS `shelters`");
        db.execSQL("DROP TABLE IF EXISTS `resources`");
        db.execSQL("DROP TABLE IF EXISTS `evacuations`");
        db.execSQL("DROP TABLE IF EXISTS `reports`");
        db.execSQL("DROP TABLE IF EXISTS `road_closures`");
        db.execSQL("DROP TABLE IF EXISTS `audit_logs`");
        db.execSQL("DROP TABLE IF EXISTS `family_members`");
        db.execSQL("DROP TABLE IF EXISTS `sos_events`");
        db.execSQL("DROP TABLE IF EXISTS `knowledge_docs`");
        db.execSQL("DROP TABLE IF EXISTS `inventory_movements`");
        db.execSQL("DROP TABLE IF EXISTS `district_configs`");
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onDestructiveMigration(db);
          }
        }
      }

      @Override
      public void onCreate(@NonNull final SupportSQLiteDatabase db) {
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onCreate(db);
          }
        }
      }

      @Override
      public void onOpen(@NonNull final SupportSQLiteDatabase db) {
        mDatabase = db;
        internalInitInvalidationTracker(db);
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onOpen(db);
          }
        }
      }

      @Override
      public void onPreMigrate(@NonNull final SupportSQLiteDatabase db) {
        DBUtil.dropFtsSyncTriggers(db);
      }

      @Override
      public void onPostMigrate(@NonNull final SupportSQLiteDatabase db) {
      }

      @Override
      @NonNull
      public RoomOpenHelper.ValidationResult onValidateSchema(
          @NonNull final SupportSQLiteDatabase db) {
        final HashMap<String, TableInfo.Column> _columnsUsers = new HashMap<String, TableInfo.Column>(16);
        _columnsUsers.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsUsers.put("email", new TableInfo.Column("email", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsUsers.put("name", new TableInfo.Column("name", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsUsers.put("phone", new TableInfo.Column("phone", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsUsers.put("role", new TableInfo.Column("role", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsUsers.put("organization", new TableInfo.Column("organization", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsUsers.put("assignedDistrict", new TableInfo.Column("assignedDistrict", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsUsers.put("status", new TableInfo.Column("status", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsUsers.put("lastActive", new TableInfo.Column("lastActive", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsUsers.put("avatarUrl", new TableInfo.Column("avatarUrl", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsUsers.put("passwordHash", new TableInfo.Column("passwordHash", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsUsers.put("createdAt", new TableInfo.Column("createdAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsUsers.put("updatedAt", new TableInfo.Column("updatedAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsUsers.put("guestMode", new TableInfo.Column("guestMode", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsUsers.put("pwdPriority", new TableInfo.Column("pwdPriority", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsUsers.put("pwdDetails", new TableInfo.Column("pwdDetails", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysUsers = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesUsers = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoUsers = new TableInfo("users", _columnsUsers, _foreignKeysUsers, _indicesUsers);
        final TableInfo _existingUsers = TableInfo.read(db, "users");
        if (!_infoUsers.equals(_existingUsers)) {
          return new RoomOpenHelper.ValidationResult(false, "users(com.safesphere.nativeapp.data.entity.UserEntity).\n"
                  + " Expected:\n" + _infoUsers + "\n"
                  + " Found:\n" + _existingUsers);
        }
        final HashMap<String, TableInfo.Column> _columnsAlerts = new HashMap<String, TableInfo.Column>(15);
        _columnsAlerts.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAlerts.put("district", new TableInfo.Column("district", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAlerts.put("severity", new TableInfo.Column("severity", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAlerts.put("message", new TableInfo.Column("message", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAlerts.put("channel", new TableInfo.Column("channel", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAlerts.put("status", new TableInfo.Column("status", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAlerts.put("acknowledgedBy", new TableInfo.Column("acknowledgedBy", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAlerts.put("acknowledgedAt", new TableInfo.Column("acknowledgedAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAlerts.put("createdAt", new TableInfo.Column("createdAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAlerts.put("expiresAt", new TableInfo.Column("expiresAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAlerts.put("isDuplicate", new TableInfo.Column("isDuplicate", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAlerts.put("originalAlertId", new TableInfo.Column("originalAlertId", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAlerts.put("language", new TableInfo.Column("language", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAlerts.put("translatedMessage", new TableInfo.Column("translatedMessage", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAlerts.put("unacknowledgedCount", new TableInfo.Column("unacknowledgedCount", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysAlerts = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesAlerts = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoAlerts = new TableInfo("alerts", _columnsAlerts, _foreignKeysAlerts, _indicesAlerts);
        final TableInfo _existingAlerts = TableInfo.read(db, "alerts");
        if (!_infoAlerts.equals(_existingAlerts)) {
          return new RoomOpenHelper.ValidationResult(false, "alerts(com.safesphere.nativeapp.data.entity.AlertEntity).\n"
                  + " Expected:\n" + _infoAlerts + "\n"
                  + " Found:\n" + _existingAlerts);
        }
        final HashMap<String, TableInfo.Column> _columnsShelters = new HashMap<String, TableInfo.Column>(17);
        _columnsShelters.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsShelters.put("name", new TableInfo.Column("name", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsShelters.put("district", new TableInfo.Column("district", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsShelters.put("lat", new TableInfo.Column("lat", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsShelters.put("lng", new TableInfo.Column("lng", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsShelters.put("capacity", new TableInfo.Column("capacity", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsShelters.put("currentOccupancy", new TableInfo.Column("currentOccupancy", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsShelters.put("water", new TableInfo.Column("water", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsShelters.put("food", new TableInfo.Column("food", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsShelters.put("medical", new TableInfo.Column("medical", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsShelters.put("electricity", new TableInfo.Column("electricity", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsShelters.put("status", new TableInfo.Column("status", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsShelters.put("contactPerson", new TableInfo.Column("contactPerson", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsShelters.put("phone", new TableInfo.Column("phone", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsShelters.put("imageUrl", new TableInfo.Column("imageUrl", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsShelters.put("createdAt", new TableInfo.Column("createdAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsShelters.put("updatedAt", new TableInfo.Column("updatedAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysShelters = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesShelters = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoShelters = new TableInfo("shelters", _columnsShelters, _foreignKeysShelters, _indicesShelters);
        final TableInfo _existingShelters = TableInfo.read(db, "shelters");
        if (!_infoShelters.equals(_existingShelters)) {
          return new RoomOpenHelper.ValidationResult(false, "shelters(com.safesphere.nativeapp.data.entity.ShelterEntity).\n"
                  + " Expected:\n" + _infoShelters + "\n"
                  + " Found:\n" + _existingShelters);
        }
        final HashMap<String, TableInfo.Column> _columnsResources = new HashMap<String, TableInfo.Column>(11);
        _columnsResources.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsResources.put("name", new TableInfo.Column("name", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsResources.put("category", new TableInfo.Column("category", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsResources.put("quantity", new TableInfo.Column("quantity", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsResources.put("unit", new TableInfo.Column("unit", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsResources.put("depotName", new TableInfo.Column("depotName", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsResources.put("lat", new TableInfo.Column("lat", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsResources.put("lng", new TableInfo.Column("lng", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsResources.put("status", new TableInfo.Column("status", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsResources.put("createdAt", new TableInfo.Column("createdAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsResources.put("updatedAt", new TableInfo.Column("updatedAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysResources = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesResources = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoResources = new TableInfo("resources", _columnsResources, _foreignKeysResources, _indicesResources);
        final TableInfo _existingResources = TableInfo.read(db, "resources");
        if (!_infoResources.equals(_existingResources)) {
          return new RoomOpenHelper.ValidationResult(false, "resources(com.safesphere.nativeapp.data.entity.ResourceEntity).\n"
                  + " Expected:\n" + _infoResources + "\n"
                  + " Found:\n" + _existingResources);
        }
        final HashMap<String, TableInfo.Column> _columnsEvacuations = new HashMap<String, TableInfo.Column>(10);
        _columnsEvacuations.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEvacuations.put("villageName", new TableInfo.Column("villageName", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEvacuations.put("shelterName", new TableInfo.Column("shelterName", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEvacuations.put("evacuees", new TableInfo.Column("evacuees", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEvacuations.put("routeDurationSec", new TableInfo.Column("routeDurationSec", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEvacuations.put("status", new TableInfo.Column("status", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEvacuations.put("busesNeeded", new TableInfo.Column("busesNeeded", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEvacuations.put("boatsNeeded", new TableInfo.Column("boatsNeeded", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEvacuations.put("createdAt", new TableInfo.Column("createdAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsEvacuations.put("updatedAt", new TableInfo.Column("updatedAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysEvacuations = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesEvacuations = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoEvacuations = new TableInfo("evacuations", _columnsEvacuations, _foreignKeysEvacuations, _indicesEvacuations);
        final TableInfo _existingEvacuations = TableInfo.read(db, "evacuations");
        if (!_infoEvacuations.equals(_existingEvacuations)) {
          return new RoomOpenHelper.ValidationResult(false, "evacuations(com.safesphere.nativeapp.data.entity.EvacuationEntity).\n"
                  + " Expected:\n" + _infoEvacuations + "\n"
                  + " Found:\n" + _existingEvacuations);
        }
        final HashMap<String, TableInfo.Column> _columnsReports = new HashMap<String, TableInfo.Column>(17);
        _columnsReports.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsReports.put("lat", new TableInfo.Column("lat", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsReports.put("lng", new TableInfo.Column("lng", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsReports.put("reportType", new TableInfo.Column("reportType", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsReports.put("source", new TableInfo.Column("source", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsReports.put("rawText", new TableInfo.Column("rawText", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsReports.put("severity", new TableInfo.Column("severity", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsReports.put("confidenceScore", new TableInfo.Column("confidenceScore", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsReports.put("verificationStatus", new TableInfo.Column("verificationStatus", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsReports.put("peopleTrapped", new TableInfo.Column("peopleTrapped", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsReports.put("peopleCount", new TableInfo.Column("peopleCount", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsReports.put("locations", new TableInfo.Column("locations", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsReports.put("summary", new TableInfo.Column("summary", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsReports.put("isPwd", new TableInfo.Column("isPwd", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsReports.put("pwdDetails", new TableInfo.Column("pwdDetails", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsReports.put("createdAt", new TableInfo.Column("createdAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsReports.put("updatedAt", new TableInfo.Column("updatedAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysReports = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesReports = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoReports = new TableInfo("reports", _columnsReports, _foreignKeysReports, _indicesReports);
        final TableInfo _existingReports = TableInfo.read(db, "reports");
        if (!_infoReports.equals(_existingReports)) {
          return new RoomOpenHelper.ValidationResult(false, "reports(com.safesphere.nativeapp.data.entity.ReportEntity).\n"
                  + " Expected:\n" + _infoReports + "\n"
                  + " Found:\n" + _existingReports);
        }
        final HashMap<String, TableInfo.Column> _columnsRoadClosures = new HashMap<String, TableInfo.Column>(8);
        _columnsRoadClosures.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadClosures.put("lat", new TableInfo.Column("lat", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadClosures.put("lng", new TableInfo.Column("lng", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadClosures.put("roadName", new TableInfo.Column("roadName", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadClosures.put("description", new TableInfo.Column("description", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadClosures.put("active", new TableInfo.Column("active", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadClosures.put("createdAt", new TableInfo.Column("createdAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsRoadClosures.put("updatedAt", new TableInfo.Column("updatedAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysRoadClosures = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesRoadClosures = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoRoadClosures = new TableInfo("road_closures", _columnsRoadClosures, _foreignKeysRoadClosures, _indicesRoadClosures);
        final TableInfo _existingRoadClosures = TableInfo.read(db, "road_closures");
        if (!_infoRoadClosures.equals(_existingRoadClosures)) {
          return new RoomOpenHelper.ValidationResult(false, "road_closures(com.safesphere.nativeapp.data.entity.RoadClosureEntity).\n"
                  + " Expected:\n" + _infoRoadClosures + "\n"
                  + " Found:\n" + _existingRoadClosures);
        }
        final HashMap<String, TableInfo.Column> _columnsAuditLogs = new HashMap<String, TableInfo.Column>(7);
        _columnsAuditLogs.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAuditLogs.put("action", new TableInfo.Column("action", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAuditLogs.put("actor", new TableInfo.Column("actor", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAuditLogs.put("resource", new TableInfo.Column("resource", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAuditLogs.put("ip", new TableInfo.Column("ip", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAuditLogs.put("severity", new TableInfo.Column("severity", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsAuditLogs.put("timestamp", new TableInfo.Column("timestamp", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysAuditLogs = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesAuditLogs = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoAuditLogs = new TableInfo("audit_logs", _columnsAuditLogs, _foreignKeysAuditLogs, _indicesAuditLogs);
        final TableInfo _existingAuditLogs = TableInfo.read(db, "audit_logs");
        if (!_infoAuditLogs.equals(_existingAuditLogs)) {
          return new RoomOpenHelper.ValidationResult(false, "audit_logs(com.safesphere.nativeapp.data.entity.AuditLogEntity).\n"
                  + " Expected:\n" + _infoAuditLogs + "\n"
                  + " Found:\n" + _existingAuditLogs);
        }
        final HashMap<String, TableInfo.Column> _columnsFamilyMembers = new HashMap<String, TableInfo.Column>(10);
        _columnsFamilyMembers.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsFamilyMembers.put("userId", new TableInfo.Column("userId", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsFamilyMembers.put("name", new TableInfo.Column("name", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsFamilyMembers.put("phone", new TableInfo.Column("phone", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsFamilyMembers.put("relation", new TableInfo.Column("relation", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsFamilyMembers.put("lat", new TableInfo.Column("lat", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsFamilyMembers.put("lng", new TableInfo.Column("lng", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsFamilyMembers.put("status", new TableInfo.Column("status", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsFamilyMembers.put("lastSeen", new TableInfo.Column("lastSeen", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsFamilyMembers.put("createdAt", new TableInfo.Column("createdAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysFamilyMembers = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesFamilyMembers = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoFamilyMembers = new TableInfo("family_members", _columnsFamilyMembers, _foreignKeysFamilyMembers, _indicesFamilyMembers);
        final TableInfo _existingFamilyMembers = TableInfo.read(db, "family_members");
        if (!_infoFamilyMembers.equals(_existingFamilyMembers)) {
          return new RoomOpenHelper.ValidationResult(false, "family_members(com.safesphere.nativeapp.data.entity.FamilyMemberEntity).\n"
                  + " Expected:\n" + _infoFamilyMembers + "\n"
                  + " Found:\n" + _existingFamilyMembers);
        }
        final HashMap<String, TableInfo.Column> _columnsSosEvents = new HashMap<String, TableInfo.Column>(10);
        _columnsSosEvents.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSosEvents.put("userId", new TableInfo.Column("userId", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSosEvents.put("type", new TableInfo.Column("type", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSosEvents.put("lat", new TableInfo.Column("lat", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSosEvents.put("lng", new TableInfo.Column("lng", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSosEvents.put("message", new TableInfo.Column("message", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSosEvents.put("status", new TableInfo.Column("status", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSosEvents.put("resolution", new TableInfo.Column("resolution", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSosEvents.put("createdAt", new TableInfo.Column("createdAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsSosEvents.put("resolvedAt", new TableInfo.Column("resolvedAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysSosEvents = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesSosEvents = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoSosEvents = new TableInfo("sos_events", _columnsSosEvents, _foreignKeysSosEvents, _indicesSosEvents);
        final TableInfo _existingSosEvents = TableInfo.read(db, "sos_events");
        if (!_infoSosEvents.equals(_existingSosEvents)) {
          return new RoomOpenHelper.ValidationResult(false, "sos_events(com.safesphere.nativeapp.data.entity.SosEventEntity).\n"
                  + " Expected:\n" + _infoSosEvents + "\n"
                  + " Found:\n" + _existingSosEvents);
        }
        final HashMap<String, TableInfo.Column> _columnsKnowledgeDocs = new HashMap<String, TableInfo.Column>(8);
        _columnsKnowledgeDocs.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsKnowledgeDocs.put("title", new TableInfo.Column("title", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsKnowledgeDocs.put("district", new TableInfo.Column("district", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsKnowledgeDocs.put("documentType", new TableInfo.Column("documentType", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsKnowledgeDocs.put("content", new TableInfo.Column("content", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsKnowledgeDocs.put("embedding", new TableInfo.Column("embedding", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsKnowledgeDocs.put("createdAt", new TableInfo.Column("createdAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsKnowledgeDocs.put("updatedAt", new TableInfo.Column("updatedAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysKnowledgeDocs = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesKnowledgeDocs = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoKnowledgeDocs = new TableInfo("knowledge_docs", _columnsKnowledgeDocs, _foreignKeysKnowledgeDocs, _indicesKnowledgeDocs);
        final TableInfo _existingKnowledgeDocs = TableInfo.read(db, "knowledge_docs");
        if (!_infoKnowledgeDocs.equals(_existingKnowledgeDocs)) {
          return new RoomOpenHelper.ValidationResult(false, "knowledge_docs(com.safesphere.nativeapp.data.entity.KnowledgeDocEntity).\n"
                  + " Expected:\n" + _infoKnowledgeDocs + "\n"
                  + " Found:\n" + _existingKnowledgeDocs);
        }
        final HashMap<String, TableInfo.Column> _columnsInventoryMovements = new HashMap<String, TableInfo.Column>(7);
        _columnsInventoryMovements.put("id", new TableInfo.Column("id", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInventoryMovements.put("resourceId", new TableInfo.Column("resourceId", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInventoryMovements.put("fromDepot", new TableInfo.Column("fromDepot", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInventoryMovements.put("toDepot", new TableInfo.Column("toDepot", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInventoryMovements.put("quantity", new TableInfo.Column("quantity", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInventoryMovements.put("timestamp", new TableInfo.Column("timestamp", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsInventoryMovements.put("status", new TableInfo.Column("status", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysInventoryMovements = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesInventoryMovements = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoInventoryMovements = new TableInfo("inventory_movements", _columnsInventoryMovements, _foreignKeysInventoryMovements, _indicesInventoryMovements);
        final TableInfo _existingInventoryMovements = TableInfo.read(db, "inventory_movements");
        if (!_infoInventoryMovements.equals(_existingInventoryMovements)) {
          return new RoomOpenHelper.ValidationResult(false, "inventory_movements(com.safesphere.nativeapp.data.entity.InventoryMovementEntity).\n"
                  + " Expected:\n" + _infoInventoryMovements + "\n"
                  + " Found:\n" + _existingInventoryMovements);
        }
        final HashMap<String, TableInfo.Column> _columnsDistrictConfigs = new HashMap<String, TableInfo.Column>(5);
        _columnsDistrictConfigs.put("district", new TableInfo.Column("district", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDistrictConfigs.put("floodThreshold", new TableInfo.Column("floodThreshold", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDistrictConfigs.put("warningThreshold", new TableInfo.Column("warningThreshold", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDistrictConfigs.put("criticalThreshold", new TableInfo.Column("criticalThreshold", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsDistrictConfigs.put("updatedAt", new TableInfo.Column("updatedAt", "TEXT", false, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysDistrictConfigs = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesDistrictConfigs = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoDistrictConfigs = new TableInfo("district_configs", _columnsDistrictConfigs, _foreignKeysDistrictConfigs, _indicesDistrictConfigs);
        final TableInfo _existingDistrictConfigs = TableInfo.read(db, "district_configs");
        if (!_infoDistrictConfigs.equals(_existingDistrictConfigs)) {
          return new RoomOpenHelper.ValidationResult(false, "district_configs(com.safesphere.nativeapp.data.entity.DistrictConfigEntity).\n"
                  + " Expected:\n" + _infoDistrictConfigs + "\n"
                  + " Found:\n" + _existingDistrictConfigs);
        }
        return new RoomOpenHelper.ValidationResult(true, null);
      }
    }, "f8352df248cbd0a8a18f27f30276da26", "42a115f02b040c0531285fb38183aefa");
    final SupportSQLiteOpenHelper.Configuration _sqliteConfig = SupportSQLiteOpenHelper.Configuration.builder(config.context).name(config.name).callback(_openCallback).build();
    final SupportSQLiteOpenHelper _helper = config.sqliteOpenHelperFactory.create(_sqliteConfig);
    return _helper;
  }

  @Override
  @NonNull
  protected InvalidationTracker createInvalidationTracker() {
    final HashMap<String, String> _shadowTablesMap = new HashMap<String, String>(0);
    final HashMap<String, Set<String>> _viewTables = new HashMap<String, Set<String>>(0);
    return new InvalidationTracker(this, _shadowTablesMap, _viewTables, "users","alerts","shelters","resources","evacuations","reports","road_closures","audit_logs","family_members","sos_events","knowledge_docs","inventory_movements","district_configs");
  }

  @Override
  public void clearAllTables() {
    super.assertNotMainThread();
    final SupportSQLiteDatabase _db = super.getOpenHelper().getWritableDatabase();
    try {
      super.beginTransaction();
      _db.execSQL("DELETE FROM `users`");
      _db.execSQL("DELETE FROM `alerts`");
      _db.execSQL("DELETE FROM `shelters`");
      _db.execSQL("DELETE FROM `resources`");
      _db.execSQL("DELETE FROM `evacuations`");
      _db.execSQL("DELETE FROM `reports`");
      _db.execSQL("DELETE FROM `road_closures`");
      _db.execSQL("DELETE FROM `audit_logs`");
      _db.execSQL("DELETE FROM `family_members`");
      _db.execSQL("DELETE FROM `sos_events`");
      _db.execSQL("DELETE FROM `knowledge_docs`");
      _db.execSQL("DELETE FROM `inventory_movements`");
      _db.execSQL("DELETE FROM `district_configs`");
      super.setTransactionSuccessful();
    } finally {
      super.endTransaction();
      _db.query("PRAGMA wal_checkpoint(FULL)").close();
      if (!_db.inTransaction()) {
        _db.execSQL("VACUUM");
      }
    }
  }

  @Override
  @NonNull
  protected Map<Class<?>, List<Class<?>>> getRequiredTypeConverters() {
    final HashMap<Class<?>, List<Class<?>>> _typeConvertersMap = new HashMap<Class<?>, List<Class<?>>>();
    _typeConvertersMap.put(UserDao.class, UserDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(AlertDao.class, AlertDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(ShelterDao.class, ShelterDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(ResourceDao.class, ResourceDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(EvacuationDao.class, EvacuationDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(ReportDao.class, ReportDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(RoadClosureDao.class, RoadClosureDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(AuditLogDao.class, AuditLogDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(FamilyMemberDao.class, FamilyMemberDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(SosEventDao.class, SosEventDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(KnowledgeDocDao.class, KnowledgeDocDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(InventoryMovementDao.class, InventoryMovementDao_Impl.getRequiredConverters());
    _typeConvertersMap.put(DistrictConfigDao.class, DistrictConfigDao_Impl.getRequiredConverters());
    return _typeConvertersMap;
  }

  @Override
  @NonNull
  public Set<Class<? extends AutoMigrationSpec>> getRequiredAutoMigrationSpecs() {
    final HashSet<Class<? extends AutoMigrationSpec>> _autoMigrationSpecsSet = new HashSet<Class<? extends AutoMigrationSpec>>();
    return _autoMigrationSpecsSet;
  }

  @Override
  @NonNull
  public List<Migration> getAutoMigrations(
      @NonNull final Map<Class<? extends AutoMigrationSpec>, AutoMigrationSpec> autoMigrationSpecs) {
    final List<Migration> _autoMigrations = new ArrayList<Migration>();
    return _autoMigrations;
  }

  @Override
  public UserDao userDao() {
    if (_userDao != null) {
      return _userDao;
    } else {
      synchronized(this) {
        if(_userDao == null) {
          _userDao = new UserDao_Impl(this);
        }
        return _userDao;
      }
    }
  }

  @Override
  public AlertDao alertDao() {
    if (_alertDao != null) {
      return _alertDao;
    } else {
      synchronized(this) {
        if(_alertDao == null) {
          _alertDao = new AlertDao_Impl(this);
        }
        return _alertDao;
      }
    }
  }

  @Override
  public ShelterDao shelterDao() {
    if (_shelterDao != null) {
      return _shelterDao;
    } else {
      synchronized(this) {
        if(_shelterDao == null) {
          _shelterDao = new ShelterDao_Impl(this);
        }
        return _shelterDao;
      }
    }
  }

  @Override
  public ResourceDao resourceDao() {
    if (_resourceDao != null) {
      return _resourceDao;
    } else {
      synchronized(this) {
        if(_resourceDao == null) {
          _resourceDao = new ResourceDao_Impl(this);
        }
        return _resourceDao;
      }
    }
  }

  @Override
  public EvacuationDao evacuationDao() {
    if (_evacuationDao != null) {
      return _evacuationDao;
    } else {
      synchronized(this) {
        if(_evacuationDao == null) {
          _evacuationDao = new EvacuationDao_Impl(this);
        }
        return _evacuationDao;
      }
    }
  }

  @Override
  public ReportDao reportDao() {
    if (_reportDao != null) {
      return _reportDao;
    } else {
      synchronized(this) {
        if(_reportDao == null) {
          _reportDao = new ReportDao_Impl(this);
        }
        return _reportDao;
      }
    }
  }

  @Override
  public RoadClosureDao roadClosureDao() {
    if (_roadClosureDao != null) {
      return _roadClosureDao;
    } else {
      synchronized(this) {
        if(_roadClosureDao == null) {
          _roadClosureDao = new RoadClosureDao_Impl(this);
        }
        return _roadClosureDao;
      }
    }
  }

  @Override
  public AuditLogDao auditLogDao() {
    if (_auditLogDao != null) {
      return _auditLogDao;
    } else {
      synchronized(this) {
        if(_auditLogDao == null) {
          _auditLogDao = new AuditLogDao_Impl(this);
        }
        return _auditLogDao;
      }
    }
  }

  @Override
  public FamilyMemberDao familyMemberDao() {
    if (_familyMemberDao != null) {
      return _familyMemberDao;
    } else {
      synchronized(this) {
        if(_familyMemberDao == null) {
          _familyMemberDao = new FamilyMemberDao_Impl(this);
        }
        return _familyMemberDao;
      }
    }
  }

  @Override
  public SosEventDao sosEventDao() {
    if (_sosEventDao != null) {
      return _sosEventDao;
    } else {
      synchronized(this) {
        if(_sosEventDao == null) {
          _sosEventDao = new SosEventDao_Impl(this);
        }
        return _sosEventDao;
      }
    }
  }

  @Override
  public KnowledgeDocDao knowledgeDocDao() {
    if (_knowledgeDocDao != null) {
      return _knowledgeDocDao;
    } else {
      synchronized(this) {
        if(_knowledgeDocDao == null) {
          _knowledgeDocDao = new KnowledgeDocDao_Impl(this);
        }
        return _knowledgeDocDao;
      }
    }
  }

  @Override
  public InventoryMovementDao inventoryMovementDao() {
    if (_inventoryMovementDao != null) {
      return _inventoryMovementDao;
    } else {
      synchronized(this) {
        if(_inventoryMovementDao == null) {
          _inventoryMovementDao = new InventoryMovementDao_Impl(this);
        }
        return _inventoryMovementDao;
      }
    }
  }

  @Override
  public DistrictConfigDao districtConfigDao() {
    if (_districtConfigDao != null) {
      return _districtConfigDao;
    } else {
      synchronized(this) {
        if(_districtConfigDao == null) {
          _districtConfigDao = new DistrictConfigDao_Impl(this);
        }
        return _districtConfigDao;
      }
    }
  }
}
