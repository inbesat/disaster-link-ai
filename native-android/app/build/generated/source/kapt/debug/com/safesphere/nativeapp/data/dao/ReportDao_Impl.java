package com.safesphere.nativeapp.data.dao;

import android.database.Cursor;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.LiveData;
import androidx.room.EntityDeletionOrUpdateAdapter;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.SharedSQLiteStatement;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.safesphere.nativeapp.data.entity.ReportEntity;
import java.lang.Class;
import java.lang.Exception;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import javax.annotation.processing.Generated;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class ReportDao_Impl implements ReportDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<ReportEntity> __insertionAdapterOfReportEntity;

  private final EntityDeletionOrUpdateAdapter<ReportEntity> __updateAdapterOfReportEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAll;

  public ReportDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfReportEntity = new EntityInsertionAdapter<ReportEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `reports` (`id`,`lat`,`lng`,`reportType`,`source`,`rawText`,`severity`,`confidenceScore`,`verificationStatus`,`peopleTrapped`,`peopleCount`,`locations`,`summary`,`isPwd`,`pwdDetails`,`createdAt`,`updatedAt`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final ReportEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        statement.bindDouble(2, entity.lat);
        statement.bindDouble(3, entity.lng);
        if (entity.reportType == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.reportType);
        }
        if (entity.source == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.source);
        }
        if (entity.rawText == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.rawText);
        }
        statement.bindLong(7, entity.severity);
        statement.bindDouble(8, entity.confidenceScore);
        if (entity.verificationStatus == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.verificationStatus);
        }
        final int _tmp = entity.peopleTrapped ? 1 : 0;
        statement.bindLong(10, _tmp);
        statement.bindLong(11, entity.peopleCount);
        if (entity.locations == null) {
          statement.bindNull(12);
        } else {
          statement.bindString(12, entity.locations);
        }
        if (entity.summary == null) {
          statement.bindNull(13);
        } else {
          statement.bindString(13, entity.summary);
        }
        final int _tmp_1 = entity.isPwd ? 1 : 0;
        statement.bindLong(14, _tmp_1);
        if (entity.pwdDetails == null) {
          statement.bindNull(15);
        } else {
          statement.bindString(15, entity.pwdDetails);
        }
        if (entity.createdAt == null) {
          statement.bindNull(16);
        } else {
          statement.bindString(16, entity.createdAt);
        }
        if (entity.updatedAt == null) {
          statement.bindNull(17);
        } else {
          statement.bindString(17, entity.updatedAt);
        }
      }
    };
    this.__updateAdapterOfReportEntity = new EntityDeletionOrUpdateAdapter<ReportEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `reports` SET `id` = ?,`lat` = ?,`lng` = ?,`reportType` = ?,`source` = ?,`rawText` = ?,`severity` = ?,`confidenceScore` = ?,`verificationStatus` = ?,`peopleTrapped` = ?,`peopleCount` = ?,`locations` = ?,`summary` = ?,`isPwd` = ?,`pwdDetails` = ?,`createdAt` = ?,`updatedAt` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final ReportEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        statement.bindDouble(2, entity.lat);
        statement.bindDouble(3, entity.lng);
        if (entity.reportType == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.reportType);
        }
        if (entity.source == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.source);
        }
        if (entity.rawText == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.rawText);
        }
        statement.bindLong(7, entity.severity);
        statement.bindDouble(8, entity.confidenceScore);
        if (entity.verificationStatus == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.verificationStatus);
        }
        final int _tmp = entity.peopleTrapped ? 1 : 0;
        statement.bindLong(10, _tmp);
        statement.bindLong(11, entity.peopleCount);
        if (entity.locations == null) {
          statement.bindNull(12);
        } else {
          statement.bindString(12, entity.locations);
        }
        if (entity.summary == null) {
          statement.bindNull(13);
        } else {
          statement.bindString(13, entity.summary);
        }
        final int _tmp_1 = entity.isPwd ? 1 : 0;
        statement.bindLong(14, _tmp_1);
        if (entity.pwdDetails == null) {
          statement.bindNull(15);
        } else {
          statement.bindString(15, entity.pwdDetails);
        }
        if (entity.createdAt == null) {
          statement.bindNull(16);
        } else {
          statement.bindString(16, entity.createdAt);
        }
        if (entity.updatedAt == null) {
          statement.bindNull(17);
        } else {
          statement.bindString(17, entity.updatedAt);
        }
        if (entity.id == null) {
          statement.bindNull(18);
        } else {
          statement.bindString(18, entity.id);
        }
      }
    };
    this.__preparedStmtOfDeleteAll = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM reports";
        return _query;
      }
    };
  }

  @Override
  public void insertAll(final List<ReportEntity> reports) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfReportEntity.insert(reports);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void insert(final ReportEntity report) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfReportEntity.insert(report);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void update(final ReportEntity report) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __updateAdapterOfReportEntity.handle(report);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void deleteAll() {
    __db.assertNotSuspendingTransaction();
    final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteAll.acquire();
    try {
      __db.beginTransaction();
      try {
        _stmt.executeUpdateDelete();
        __db.setTransactionSuccessful();
      } finally {
        __db.endTransaction();
      }
    } finally {
      __preparedStmtOfDeleteAll.release(_stmt);
    }
  }

  @Override
  public LiveData<ReportEntity> getById(final String id) {
    final String _sql = "SELECT * FROM reports WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (id == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, id);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"reports"}, false, new Callable<ReportEntity>() {
      @Override
      @Nullable
      public ReportEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfLat = CursorUtil.getColumnIndexOrThrow(_cursor, "lat");
          final int _cursorIndexOfLng = CursorUtil.getColumnIndexOrThrow(_cursor, "lng");
          final int _cursorIndexOfReportType = CursorUtil.getColumnIndexOrThrow(_cursor, "reportType");
          final int _cursorIndexOfSource = CursorUtil.getColumnIndexOrThrow(_cursor, "source");
          final int _cursorIndexOfRawText = CursorUtil.getColumnIndexOrThrow(_cursor, "rawText");
          final int _cursorIndexOfSeverity = CursorUtil.getColumnIndexOrThrow(_cursor, "severity");
          final int _cursorIndexOfConfidenceScore = CursorUtil.getColumnIndexOrThrow(_cursor, "confidenceScore");
          final int _cursorIndexOfVerificationStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "verificationStatus");
          final int _cursorIndexOfPeopleTrapped = CursorUtil.getColumnIndexOrThrow(_cursor, "peopleTrapped");
          final int _cursorIndexOfPeopleCount = CursorUtil.getColumnIndexOrThrow(_cursor, "peopleCount");
          final int _cursorIndexOfLocations = CursorUtil.getColumnIndexOrThrow(_cursor, "locations");
          final int _cursorIndexOfSummary = CursorUtil.getColumnIndexOrThrow(_cursor, "summary");
          final int _cursorIndexOfIsPwd = CursorUtil.getColumnIndexOrThrow(_cursor, "isPwd");
          final int _cursorIndexOfPwdDetails = CursorUtil.getColumnIndexOrThrow(_cursor, "pwdDetails");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final ReportEntity _result;
          if (_cursor.moveToFirst()) {
            _result = new ReportEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _result.id = null;
            } else {
              _result.id = _cursor.getString(_cursorIndexOfId);
            }
            _result.lat = _cursor.getDouble(_cursorIndexOfLat);
            _result.lng = _cursor.getDouble(_cursorIndexOfLng);
            if (_cursor.isNull(_cursorIndexOfReportType)) {
              _result.reportType = null;
            } else {
              _result.reportType = _cursor.getString(_cursorIndexOfReportType);
            }
            if (_cursor.isNull(_cursorIndexOfSource)) {
              _result.source = null;
            } else {
              _result.source = _cursor.getString(_cursorIndexOfSource);
            }
            if (_cursor.isNull(_cursorIndexOfRawText)) {
              _result.rawText = null;
            } else {
              _result.rawText = _cursor.getString(_cursorIndexOfRawText);
            }
            _result.severity = _cursor.getInt(_cursorIndexOfSeverity);
            _result.confidenceScore = _cursor.getDouble(_cursorIndexOfConfidenceScore);
            if (_cursor.isNull(_cursorIndexOfVerificationStatus)) {
              _result.verificationStatus = null;
            } else {
              _result.verificationStatus = _cursor.getString(_cursorIndexOfVerificationStatus);
            }
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfPeopleTrapped);
            _result.peopleTrapped = _tmp != 0;
            _result.peopleCount = _cursor.getInt(_cursorIndexOfPeopleCount);
            if (_cursor.isNull(_cursorIndexOfLocations)) {
              _result.locations = null;
            } else {
              _result.locations = _cursor.getString(_cursorIndexOfLocations);
            }
            if (_cursor.isNull(_cursorIndexOfSummary)) {
              _result.summary = null;
            } else {
              _result.summary = _cursor.getString(_cursorIndexOfSummary);
            }
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfIsPwd);
            _result.isPwd = _tmp_1 != 0;
            if (_cursor.isNull(_cursorIndexOfPwdDetails)) {
              _result.pwdDetails = null;
            } else {
              _result.pwdDetails = _cursor.getString(_cursorIndexOfPwdDetails);
            }
            if (_cursor.isNull(_cursorIndexOfCreatedAt)) {
              _result.createdAt = null;
            } else {
              _result.createdAt = _cursor.getString(_cursorIndexOfCreatedAt);
            }
            if (_cursor.isNull(_cursorIndexOfUpdatedAt)) {
              _result.updatedAt = null;
            } else {
              _result.updatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            }
          } else {
            _result = null;
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @Override
  public LiveData<List<ReportEntity>> getByStatus(final String status) {
    final String _sql = "SELECT * FROM reports WHERE verificationStatus = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (status == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, status);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"reports"}, false, new Callable<List<ReportEntity>>() {
      @Override
      @Nullable
      public List<ReportEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfLat = CursorUtil.getColumnIndexOrThrow(_cursor, "lat");
          final int _cursorIndexOfLng = CursorUtil.getColumnIndexOrThrow(_cursor, "lng");
          final int _cursorIndexOfReportType = CursorUtil.getColumnIndexOrThrow(_cursor, "reportType");
          final int _cursorIndexOfSource = CursorUtil.getColumnIndexOrThrow(_cursor, "source");
          final int _cursorIndexOfRawText = CursorUtil.getColumnIndexOrThrow(_cursor, "rawText");
          final int _cursorIndexOfSeverity = CursorUtil.getColumnIndexOrThrow(_cursor, "severity");
          final int _cursorIndexOfConfidenceScore = CursorUtil.getColumnIndexOrThrow(_cursor, "confidenceScore");
          final int _cursorIndexOfVerificationStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "verificationStatus");
          final int _cursorIndexOfPeopleTrapped = CursorUtil.getColumnIndexOrThrow(_cursor, "peopleTrapped");
          final int _cursorIndexOfPeopleCount = CursorUtil.getColumnIndexOrThrow(_cursor, "peopleCount");
          final int _cursorIndexOfLocations = CursorUtil.getColumnIndexOrThrow(_cursor, "locations");
          final int _cursorIndexOfSummary = CursorUtil.getColumnIndexOrThrow(_cursor, "summary");
          final int _cursorIndexOfIsPwd = CursorUtil.getColumnIndexOrThrow(_cursor, "isPwd");
          final int _cursorIndexOfPwdDetails = CursorUtil.getColumnIndexOrThrow(_cursor, "pwdDetails");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final List<ReportEntity> _result = new ArrayList<ReportEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ReportEntity _item;
            _item = new ReportEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            _item.lat = _cursor.getDouble(_cursorIndexOfLat);
            _item.lng = _cursor.getDouble(_cursorIndexOfLng);
            if (_cursor.isNull(_cursorIndexOfReportType)) {
              _item.reportType = null;
            } else {
              _item.reportType = _cursor.getString(_cursorIndexOfReportType);
            }
            if (_cursor.isNull(_cursorIndexOfSource)) {
              _item.source = null;
            } else {
              _item.source = _cursor.getString(_cursorIndexOfSource);
            }
            if (_cursor.isNull(_cursorIndexOfRawText)) {
              _item.rawText = null;
            } else {
              _item.rawText = _cursor.getString(_cursorIndexOfRawText);
            }
            _item.severity = _cursor.getInt(_cursorIndexOfSeverity);
            _item.confidenceScore = _cursor.getDouble(_cursorIndexOfConfidenceScore);
            if (_cursor.isNull(_cursorIndexOfVerificationStatus)) {
              _item.verificationStatus = null;
            } else {
              _item.verificationStatus = _cursor.getString(_cursorIndexOfVerificationStatus);
            }
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfPeopleTrapped);
            _item.peopleTrapped = _tmp != 0;
            _item.peopleCount = _cursor.getInt(_cursorIndexOfPeopleCount);
            if (_cursor.isNull(_cursorIndexOfLocations)) {
              _item.locations = null;
            } else {
              _item.locations = _cursor.getString(_cursorIndexOfLocations);
            }
            if (_cursor.isNull(_cursorIndexOfSummary)) {
              _item.summary = null;
            } else {
              _item.summary = _cursor.getString(_cursorIndexOfSummary);
            }
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfIsPwd);
            _item.isPwd = _tmp_1 != 0;
            if (_cursor.isNull(_cursorIndexOfPwdDetails)) {
              _item.pwdDetails = null;
            } else {
              _item.pwdDetails = _cursor.getString(_cursorIndexOfPwdDetails);
            }
            if (_cursor.isNull(_cursorIndexOfCreatedAt)) {
              _item.createdAt = null;
            } else {
              _item.createdAt = _cursor.getString(_cursorIndexOfCreatedAt);
            }
            if (_cursor.isNull(_cursorIndexOfUpdatedAt)) {
              _item.updatedAt = null;
            } else {
              _item.updatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            }
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @Override
  public LiveData<List<ReportEntity>> getAll() {
    final String _sql = "SELECT * FROM reports ORDER BY createdAt DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return __db.getInvalidationTracker().createLiveData(new String[] {"reports"}, false, new Callable<List<ReportEntity>>() {
      @Override
      @Nullable
      public List<ReportEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfLat = CursorUtil.getColumnIndexOrThrow(_cursor, "lat");
          final int _cursorIndexOfLng = CursorUtil.getColumnIndexOrThrow(_cursor, "lng");
          final int _cursorIndexOfReportType = CursorUtil.getColumnIndexOrThrow(_cursor, "reportType");
          final int _cursorIndexOfSource = CursorUtil.getColumnIndexOrThrow(_cursor, "source");
          final int _cursorIndexOfRawText = CursorUtil.getColumnIndexOrThrow(_cursor, "rawText");
          final int _cursorIndexOfSeverity = CursorUtil.getColumnIndexOrThrow(_cursor, "severity");
          final int _cursorIndexOfConfidenceScore = CursorUtil.getColumnIndexOrThrow(_cursor, "confidenceScore");
          final int _cursorIndexOfVerificationStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "verificationStatus");
          final int _cursorIndexOfPeopleTrapped = CursorUtil.getColumnIndexOrThrow(_cursor, "peopleTrapped");
          final int _cursorIndexOfPeopleCount = CursorUtil.getColumnIndexOrThrow(_cursor, "peopleCount");
          final int _cursorIndexOfLocations = CursorUtil.getColumnIndexOrThrow(_cursor, "locations");
          final int _cursorIndexOfSummary = CursorUtil.getColumnIndexOrThrow(_cursor, "summary");
          final int _cursorIndexOfIsPwd = CursorUtil.getColumnIndexOrThrow(_cursor, "isPwd");
          final int _cursorIndexOfPwdDetails = CursorUtil.getColumnIndexOrThrow(_cursor, "pwdDetails");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final List<ReportEntity> _result = new ArrayList<ReportEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ReportEntity _item;
            _item = new ReportEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            _item.lat = _cursor.getDouble(_cursorIndexOfLat);
            _item.lng = _cursor.getDouble(_cursorIndexOfLng);
            if (_cursor.isNull(_cursorIndexOfReportType)) {
              _item.reportType = null;
            } else {
              _item.reportType = _cursor.getString(_cursorIndexOfReportType);
            }
            if (_cursor.isNull(_cursorIndexOfSource)) {
              _item.source = null;
            } else {
              _item.source = _cursor.getString(_cursorIndexOfSource);
            }
            if (_cursor.isNull(_cursorIndexOfRawText)) {
              _item.rawText = null;
            } else {
              _item.rawText = _cursor.getString(_cursorIndexOfRawText);
            }
            _item.severity = _cursor.getInt(_cursorIndexOfSeverity);
            _item.confidenceScore = _cursor.getDouble(_cursorIndexOfConfidenceScore);
            if (_cursor.isNull(_cursorIndexOfVerificationStatus)) {
              _item.verificationStatus = null;
            } else {
              _item.verificationStatus = _cursor.getString(_cursorIndexOfVerificationStatus);
            }
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfPeopleTrapped);
            _item.peopleTrapped = _tmp != 0;
            _item.peopleCount = _cursor.getInt(_cursorIndexOfPeopleCount);
            if (_cursor.isNull(_cursorIndexOfLocations)) {
              _item.locations = null;
            } else {
              _item.locations = _cursor.getString(_cursorIndexOfLocations);
            }
            if (_cursor.isNull(_cursorIndexOfSummary)) {
              _item.summary = null;
            } else {
              _item.summary = _cursor.getString(_cursorIndexOfSummary);
            }
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfIsPwd);
            _item.isPwd = _tmp_1 != 0;
            if (_cursor.isNull(_cursorIndexOfPwdDetails)) {
              _item.pwdDetails = null;
            } else {
              _item.pwdDetails = _cursor.getString(_cursorIndexOfPwdDetails);
            }
            if (_cursor.isNull(_cursorIndexOfCreatedAt)) {
              _item.createdAt = null;
            } else {
              _item.createdAt = _cursor.getString(_cursorIndexOfCreatedAt);
            }
            if (_cursor.isNull(_cursorIndexOfUpdatedAt)) {
              _item.updatedAt = null;
            } else {
              _item.updatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            }
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @Override
  public LiveData<List<ReportEntity>> getPwdPriority() {
    final String _sql = "SELECT * FROM reports WHERE isPwd = 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return __db.getInvalidationTracker().createLiveData(new String[] {"reports"}, false, new Callable<List<ReportEntity>>() {
      @Override
      @Nullable
      public List<ReportEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfLat = CursorUtil.getColumnIndexOrThrow(_cursor, "lat");
          final int _cursorIndexOfLng = CursorUtil.getColumnIndexOrThrow(_cursor, "lng");
          final int _cursorIndexOfReportType = CursorUtil.getColumnIndexOrThrow(_cursor, "reportType");
          final int _cursorIndexOfSource = CursorUtil.getColumnIndexOrThrow(_cursor, "source");
          final int _cursorIndexOfRawText = CursorUtil.getColumnIndexOrThrow(_cursor, "rawText");
          final int _cursorIndexOfSeverity = CursorUtil.getColumnIndexOrThrow(_cursor, "severity");
          final int _cursorIndexOfConfidenceScore = CursorUtil.getColumnIndexOrThrow(_cursor, "confidenceScore");
          final int _cursorIndexOfVerificationStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "verificationStatus");
          final int _cursorIndexOfPeopleTrapped = CursorUtil.getColumnIndexOrThrow(_cursor, "peopleTrapped");
          final int _cursorIndexOfPeopleCount = CursorUtil.getColumnIndexOrThrow(_cursor, "peopleCount");
          final int _cursorIndexOfLocations = CursorUtil.getColumnIndexOrThrow(_cursor, "locations");
          final int _cursorIndexOfSummary = CursorUtil.getColumnIndexOrThrow(_cursor, "summary");
          final int _cursorIndexOfIsPwd = CursorUtil.getColumnIndexOrThrow(_cursor, "isPwd");
          final int _cursorIndexOfPwdDetails = CursorUtil.getColumnIndexOrThrow(_cursor, "pwdDetails");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final List<ReportEntity> _result = new ArrayList<ReportEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final ReportEntity _item;
            _item = new ReportEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            _item.lat = _cursor.getDouble(_cursorIndexOfLat);
            _item.lng = _cursor.getDouble(_cursorIndexOfLng);
            if (_cursor.isNull(_cursorIndexOfReportType)) {
              _item.reportType = null;
            } else {
              _item.reportType = _cursor.getString(_cursorIndexOfReportType);
            }
            if (_cursor.isNull(_cursorIndexOfSource)) {
              _item.source = null;
            } else {
              _item.source = _cursor.getString(_cursorIndexOfSource);
            }
            if (_cursor.isNull(_cursorIndexOfRawText)) {
              _item.rawText = null;
            } else {
              _item.rawText = _cursor.getString(_cursorIndexOfRawText);
            }
            _item.severity = _cursor.getInt(_cursorIndexOfSeverity);
            _item.confidenceScore = _cursor.getDouble(_cursorIndexOfConfidenceScore);
            if (_cursor.isNull(_cursorIndexOfVerificationStatus)) {
              _item.verificationStatus = null;
            } else {
              _item.verificationStatus = _cursor.getString(_cursorIndexOfVerificationStatus);
            }
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfPeopleTrapped);
            _item.peopleTrapped = _tmp != 0;
            _item.peopleCount = _cursor.getInt(_cursorIndexOfPeopleCount);
            if (_cursor.isNull(_cursorIndexOfLocations)) {
              _item.locations = null;
            } else {
              _item.locations = _cursor.getString(_cursorIndexOfLocations);
            }
            if (_cursor.isNull(_cursorIndexOfSummary)) {
              _item.summary = null;
            } else {
              _item.summary = _cursor.getString(_cursorIndexOfSummary);
            }
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfIsPwd);
            _item.isPwd = _tmp_1 != 0;
            if (_cursor.isNull(_cursorIndexOfPwdDetails)) {
              _item.pwdDetails = null;
            } else {
              _item.pwdDetails = _cursor.getString(_cursorIndexOfPwdDetails);
            }
            if (_cursor.isNull(_cursorIndexOfCreatedAt)) {
              _item.createdAt = null;
            } else {
              _item.createdAt = _cursor.getString(_cursorIndexOfCreatedAt);
            }
            if (_cursor.isNull(_cursorIndexOfUpdatedAt)) {
              _item.updatedAt = null;
            } else {
              _item.updatedAt = _cursor.getString(_cursorIndexOfUpdatedAt);
            }
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
        }
      }

      @Override
      protected void finalize() {
        _statement.release();
      }
    });
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
