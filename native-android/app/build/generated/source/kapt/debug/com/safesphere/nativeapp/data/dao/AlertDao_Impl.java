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
import com.safesphere.nativeapp.data.entity.AlertEntity;
import java.lang.Class;
import java.lang.Exception;
import java.lang.Integer;
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
public final class AlertDao_Impl implements AlertDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<AlertEntity> __insertionAdapterOfAlertEntity;

  private final EntityDeletionOrUpdateAdapter<AlertEntity> __updateAdapterOfAlertEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAll;

  public AlertDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfAlertEntity = new EntityInsertionAdapter<AlertEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `alerts` (`id`,`district`,`severity`,`message`,`channel`,`status`,`acknowledgedBy`,`acknowledgedAt`,`createdAt`,`expiresAt`,`isDuplicate`,`originalAlertId`,`language`,`translatedMessage`,`unacknowledgedCount`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final AlertEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        if (entity.district == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.district);
        }
        if (entity.severity == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.severity);
        }
        if (entity.message == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.message);
        }
        if (entity.channel == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.channel);
        }
        if (entity.status == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.status);
        }
        if (entity.acknowledgedBy == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.acknowledgedBy);
        }
        if (entity.acknowledgedAt == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.acknowledgedAt);
        }
        if (entity.createdAt == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.createdAt);
        }
        if (entity.expiresAt == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.expiresAt);
        }
        final int _tmp = entity.isDuplicate ? 1 : 0;
        statement.bindLong(11, _tmp);
        if (entity.originalAlertId == null) {
          statement.bindNull(12);
        } else {
          statement.bindString(12, entity.originalAlertId);
        }
        if (entity.language == null) {
          statement.bindNull(13);
        } else {
          statement.bindString(13, entity.language);
        }
        if (entity.translatedMessage == null) {
          statement.bindNull(14);
        } else {
          statement.bindString(14, entity.translatedMessage);
        }
        statement.bindLong(15, entity.unacknowledgedCount);
      }
    };
    this.__updateAdapterOfAlertEntity = new EntityDeletionOrUpdateAdapter<AlertEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `alerts` SET `id` = ?,`district` = ?,`severity` = ?,`message` = ?,`channel` = ?,`status` = ?,`acknowledgedBy` = ?,`acknowledgedAt` = ?,`createdAt` = ?,`expiresAt` = ?,`isDuplicate` = ?,`originalAlertId` = ?,`language` = ?,`translatedMessage` = ?,`unacknowledgedCount` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final AlertEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        if (entity.district == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.district);
        }
        if (entity.severity == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.severity);
        }
        if (entity.message == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.message);
        }
        if (entity.channel == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.channel);
        }
        if (entity.status == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.status);
        }
        if (entity.acknowledgedBy == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.acknowledgedBy);
        }
        if (entity.acknowledgedAt == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.acknowledgedAt);
        }
        if (entity.createdAt == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.createdAt);
        }
        if (entity.expiresAt == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.expiresAt);
        }
        final int _tmp = entity.isDuplicate ? 1 : 0;
        statement.bindLong(11, _tmp);
        if (entity.originalAlertId == null) {
          statement.bindNull(12);
        } else {
          statement.bindString(12, entity.originalAlertId);
        }
        if (entity.language == null) {
          statement.bindNull(13);
        } else {
          statement.bindString(13, entity.language);
        }
        if (entity.translatedMessage == null) {
          statement.bindNull(14);
        } else {
          statement.bindString(14, entity.translatedMessage);
        }
        statement.bindLong(15, entity.unacknowledgedCount);
        if (entity.id == null) {
          statement.bindNull(16);
        } else {
          statement.bindString(16, entity.id);
        }
      }
    };
    this.__preparedStmtOfDeleteAll = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM alerts";
        return _query;
      }
    };
  }

  @Override
  public void insertAll(final List<AlertEntity> alerts) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfAlertEntity.insert(alerts);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void insert(final AlertEntity alert) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfAlertEntity.insert(alert);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void update(final AlertEntity alert) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __updateAdapterOfAlertEntity.handle(alert);
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
  public LiveData<AlertEntity> getById(final String id) {
    final String _sql = "SELECT * FROM alerts WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (id == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, id);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"alerts"}, false, new Callable<AlertEntity>() {
      @Override
      @Nullable
      public AlertEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "district");
          final int _cursorIndexOfSeverity = CursorUtil.getColumnIndexOrThrow(_cursor, "severity");
          final int _cursorIndexOfMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "message");
          final int _cursorIndexOfChannel = CursorUtil.getColumnIndexOrThrow(_cursor, "channel");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfAcknowledgedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "acknowledgedBy");
          final int _cursorIndexOfAcknowledgedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "acknowledgedAt");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfExpiresAt = CursorUtil.getColumnIndexOrThrow(_cursor, "expiresAt");
          final int _cursorIndexOfIsDuplicate = CursorUtil.getColumnIndexOrThrow(_cursor, "isDuplicate");
          final int _cursorIndexOfOriginalAlertId = CursorUtil.getColumnIndexOrThrow(_cursor, "originalAlertId");
          final int _cursorIndexOfLanguage = CursorUtil.getColumnIndexOrThrow(_cursor, "language");
          final int _cursorIndexOfTranslatedMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "translatedMessage");
          final int _cursorIndexOfUnacknowledgedCount = CursorUtil.getColumnIndexOrThrow(_cursor, "unacknowledgedCount");
          final AlertEntity _result;
          if (_cursor.moveToFirst()) {
            _result = new AlertEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _result.id = null;
            } else {
              _result.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfDistrict)) {
              _result.district = null;
            } else {
              _result.district = _cursor.getString(_cursorIndexOfDistrict);
            }
            if (_cursor.isNull(_cursorIndexOfSeverity)) {
              _result.severity = null;
            } else {
              _result.severity = _cursor.getString(_cursorIndexOfSeverity);
            }
            if (_cursor.isNull(_cursorIndexOfMessage)) {
              _result.message = null;
            } else {
              _result.message = _cursor.getString(_cursorIndexOfMessage);
            }
            if (_cursor.isNull(_cursorIndexOfChannel)) {
              _result.channel = null;
            } else {
              _result.channel = _cursor.getString(_cursorIndexOfChannel);
            }
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _result.status = null;
            } else {
              _result.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfAcknowledgedBy)) {
              _result.acknowledgedBy = null;
            } else {
              _result.acknowledgedBy = _cursor.getString(_cursorIndexOfAcknowledgedBy);
            }
            if (_cursor.isNull(_cursorIndexOfAcknowledgedAt)) {
              _result.acknowledgedAt = null;
            } else {
              _result.acknowledgedAt = _cursor.getString(_cursorIndexOfAcknowledgedAt);
            }
            if (_cursor.isNull(_cursorIndexOfCreatedAt)) {
              _result.createdAt = null;
            } else {
              _result.createdAt = _cursor.getString(_cursorIndexOfCreatedAt);
            }
            if (_cursor.isNull(_cursorIndexOfExpiresAt)) {
              _result.expiresAt = null;
            } else {
              _result.expiresAt = _cursor.getString(_cursorIndexOfExpiresAt);
            }
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsDuplicate);
            _result.isDuplicate = _tmp != 0;
            if (_cursor.isNull(_cursorIndexOfOriginalAlertId)) {
              _result.originalAlertId = null;
            } else {
              _result.originalAlertId = _cursor.getString(_cursorIndexOfOriginalAlertId);
            }
            if (_cursor.isNull(_cursorIndexOfLanguage)) {
              _result.language = null;
            } else {
              _result.language = _cursor.getString(_cursorIndexOfLanguage);
            }
            if (_cursor.isNull(_cursorIndexOfTranslatedMessage)) {
              _result.translatedMessage = null;
            } else {
              _result.translatedMessage = _cursor.getString(_cursorIndexOfTranslatedMessage);
            }
            _result.unacknowledgedCount = _cursor.getInt(_cursorIndexOfUnacknowledgedCount);
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
  public LiveData<List<AlertEntity>> getByDistrict(final String district) {
    final String _sql = "SELECT * FROM alerts WHERE district = ? ORDER BY createdAt DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (district == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, district);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"alerts"}, false, new Callable<List<AlertEntity>>() {
      @Override
      @Nullable
      public List<AlertEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "district");
          final int _cursorIndexOfSeverity = CursorUtil.getColumnIndexOrThrow(_cursor, "severity");
          final int _cursorIndexOfMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "message");
          final int _cursorIndexOfChannel = CursorUtil.getColumnIndexOrThrow(_cursor, "channel");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfAcknowledgedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "acknowledgedBy");
          final int _cursorIndexOfAcknowledgedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "acknowledgedAt");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfExpiresAt = CursorUtil.getColumnIndexOrThrow(_cursor, "expiresAt");
          final int _cursorIndexOfIsDuplicate = CursorUtil.getColumnIndexOrThrow(_cursor, "isDuplicate");
          final int _cursorIndexOfOriginalAlertId = CursorUtil.getColumnIndexOrThrow(_cursor, "originalAlertId");
          final int _cursorIndexOfLanguage = CursorUtil.getColumnIndexOrThrow(_cursor, "language");
          final int _cursorIndexOfTranslatedMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "translatedMessage");
          final int _cursorIndexOfUnacknowledgedCount = CursorUtil.getColumnIndexOrThrow(_cursor, "unacknowledgedCount");
          final List<AlertEntity> _result = new ArrayList<AlertEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final AlertEntity _item;
            _item = new AlertEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfDistrict)) {
              _item.district = null;
            } else {
              _item.district = _cursor.getString(_cursorIndexOfDistrict);
            }
            if (_cursor.isNull(_cursorIndexOfSeverity)) {
              _item.severity = null;
            } else {
              _item.severity = _cursor.getString(_cursorIndexOfSeverity);
            }
            if (_cursor.isNull(_cursorIndexOfMessage)) {
              _item.message = null;
            } else {
              _item.message = _cursor.getString(_cursorIndexOfMessage);
            }
            if (_cursor.isNull(_cursorIndexOfChannel)) {
              _item.channel = null;
            } else {
              _item.channel = _cursor.getString(_cursorIndexOfChannel);
            }
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _item.status = null;
            } else {
              _item.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfAcknowledgedBy)) {
              _item.acknowledgedBy = null;
            } else {
              _item.acknowledgedBy = _cursor.getString(_cursorIndexOfAcknowledgedBy);
            }
            if (_cursor.isNull(_cursorIndexOfAcknowledgedAt)) {
              _item.acknowledgedAt = null;
            } else {
              _item.acknowledgedAt = _cursor.getString(_cursorIndexOfAcknowledgedAt);
            }
            if (_cursor.isNull(_cursorIndexOfCreatedAt)) {
              _item.createdAt = null;
            } else {
              _item.createdAt = _cursor.getString(_cursorIndexOfCreatedAt);
            }
            if (_cursor.isNull(_cursorIndexOfExpiresAt)) {
              _item.expiresAt = null;
            } else {
              _item.expiresAt = _cursor.getString(_cursorIndexOfExpiresAt);
            }
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsDuplicate);
            _item.isDuplicate = _tmp != 0;
            if (_cursor.isNull(_cursorIndexOfOriginalAlertId)) {
              _item.originalAlertId = null;
            } else {
              _item.originalAlertId = _cursor.getString(_cursorIndexOfOriginalAlertId);
            }
            if (_cursor.isNull(_cursorIndexOfLanguage)) {
              _item.language = null;
            } else {
              _item.language = _cursor.getString(_cursorIndexOfLanguage);
            }
            if (_cursor.isNull(_cursorIndexOfTranslatedMessage)) {
              _item.translatedMessage = null;
            } else {
              _item.translatedMessage = _cursor.getString(_cursorIndexOfTranslatedMessage);
            }
            _item.unacknowledgedCount = _cursor.getInt(_cursorIndexOfUnacknowledgedCount);
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
  public LiveData<List<AlertEntity>> getBySeverity(final String severity) {
    final String _sql = "SELECT * FROM alerts WHERE severity = ? ORDER BY createdAt DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (severity == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, severity);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"alerts"}, false, new Callable<List<AlertEntity>>() {
      @Override
      @Nullable
      public List<AlertEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "district");
          final int _cursorIndexOfSeverity = CursorUtil.getColumnIndexOrThrow(_cursor, "severity");
          final int _cursorIndexOfMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "message");
          final int _cursorIndexOfChannel = CursorUtil.getColumnIndexOrThrow(_cursor, "channel");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfAcknowledgedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "acknowledgedBy");
          final int _cursorIndexOfAcknowledgedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "acknowledgedAt");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfExpiresAt = CursorUtil.getColumnIndexOrThrow(_cursor, "expiresAt");
          final int _cursorIndexOfIsDuplicate = CursorUtil.getColumnIndexOrThrow(_cursor, "isDuplicate");
          final int _cursorIndexOfOriginalAlertId = CursorUtil.getColumnIndexOrThrow(_cursor, "originalAlertId");
          final int _cursorIndexOfLanguage = CursorUtil.getColumnIndexOrThrow(_cursor, "language");
          final int _cursorIndexOfTranslatedMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "translatedMessage");
          final int _cursorIndexOfUnacknowledgedCount = CursorUtil.getColumnIndexOrThrow(_cursor, "unacknowledgedCount");
          final List<AlertEntity> _result = new ArrayList<AlertEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final AlertEntity _item;
            _item = new AlertEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfDistrict)) {
              _item.district = null;
            } else {
              _item.district = _cursor.getString(_cursorIndexOfDistrict);
            }
            if (_cursor.isNull(_cursorIndexOfSeverity)) {
              _item.severity = null;
            } else {
              _item.severity = _cursor.getString(_cursorIndexOfSeverity);
            }
            if (_cursor.isNull(_cursorIndexOfMessage)) {
              _item.message = null;
            } else {
              _item.message = _cursor.getString(_cursorIndexOfMessage);
            }
            if (_cursor.isNull(_cursorIndexOfChannel)) {
              _item.channel = null;
            } else {
              _item.channel = _cursor.getString(_cursorIndexOfChannel);
            }
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _item.status = null;
            } else {
              _item.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfAcknowledgedBy)) {
              _item.acknowledgedBy = null;
            } else {
              _item.acknowledgedBy = _cursor.getString(_cursorIndexOfAcknowledgedBy);
            }
            if (_cursor.isNull(_cursorIndexOfAcknowledgedAt)) {
              _item.acknowledgedAt = null;
            } else {
              _item.acknowledgedAt = _cursor.getString(_cursorIndexOfAcknowledgedAt);
            }
            if (_cursor.isNull(_cursorIndexOfCreatedAt)) {
              _item.createdAt = null;
            } else {
              _item.createdAt = _cursor.getString(_cursorIndexOfCreatedAt);
            }
            if (_cursor.isNull(_cursorIndexOfExpiresAt)) {
              _item.expiresAt = null;
            } else {
              _item.expiresAt = _cursor.getString(_cursorIndexOfExpiresAt);
            }
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsDuplicate);
            _item.isDuplicate = _tmp != 0;
            if (_cursor.isNull(_cursorIndexOfOriginalAlertId)) {
              _item.originalAlertId = null;
            } else {
              _item.originalAlertId = _cursor.getString(_cursorIndexOfOriginalAlertId);
            }
            if (_cursor.isNull(_cursorIndexOfLanguage)) {
              _item.language = null;
            } else {
              _item.language = _cursor.getString(_cursorIndexOfLanguage);
            }
            if (_cursor.isNull(_cursorIndexOfTranslatedMessage)) {
              _item.translatedMessage = null;
            } else {
              _item.translatedMessage = _cursor.getString(_cursorIndexOfTranslatedMessage);
            }
            _item.unacknowledgedCount = _cursor.getInt(_cursorIndexOfUnacknowledgedCount);
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
  public LiveData<List<AlertEntity>> getUnacknowledged() {
    final String _sql = "SELECT * FROM alerts WHERE acknowledgedBy IS NULL ORDER BY createdAt DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return __db.getInvalidationTracker().createLiveData(new String[] {"alerts"}, false, new Callable<List<AlertEntity>>() {
      @Override
      @Nullable
      public List<AlertEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "district");
          final int _cursorIndexOfSeverity = CursorUtil.getColumnIndexOrThrow(_cursor, "severity");
          final int _cursorIndexOfMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "message");
          final int _cursorIndexOfChannel = CursorUtil.getColumnIndexOrThrow(_cursor, "channel");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfAcknowledgedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "acknowledgedBy");
          final int _cursorIndexOfAcknowledgedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "acknowledgedAt");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfExpiresAt = CursorUtil.getColumnIndexOrThrow(_cursor, "expiresAt");
          final int _cursorIndexOfIsDuplicate = CursorUtil.getColumnIndexOrThrow(_cursor, "isDuplicate");
          final int _cursorIndexOfOriginalAlertId = CursorUtil.getColumnIndexOrThrow(_cursor, "originalAlertId");
          final int _cursorIndexOfLanguage = CursorUtil.getColumnIndexOrThrow(_cursor, "language");
          final int _cursorIndexOfTranslatedMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "translatedMessage");
          final int _cursorIndexOfUnacknowledgedCount = CursorUtil.getColumnIndexOrThrow(_cursor, "unacknowledgedCount");
          final List<AlertEntity> _result = new ArrayList<AlertEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final AlertEntity _item;
            _item = new AlertEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfDistrict)) {
              _item.district = null;
            } else {
              _item.district = _cursor.getString(_cursorIndexOfDistrict);
            }
            if (_cursor.isNull(_cursorIndexOfSeverity)) {
              _item.severity = null;
            } else {
              _item.severity = _cursor.getString(_cursorIndexOfSeverity);
            }
            if (_cursor.isNull(_cursorIndexOfMessage)) {
              _item.message = null;
            } else {
              _item.message = _cursor.getString(_cursorIndexOfMessage);
            }
            if (_cursor.isNull(_cursorIndexOfChannel)) {
              _item.channel = null;
            } else {
              _item.channel = _cursor.getString(_cursorIndexOfChannel);
            }
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _item.status = null;
            } else {
              _item.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfAcknowledgedBy)) {
              _item.acknowledgedBy = null;
            } else {
              _item.acknowledgedBy = _cursor.getString(_cursorIndexOfAcknowledgedBy);
            }
            if (_cursor.isNull(_cursorIndexOfAcknowledgedAt)) {
              _item.acknowledgedAt = null;
            } else {
              _item.acknowledgedAt = _cursor.getString(_cursorIndexOfAcknowledgedAt);
            }
            if (_cursor.isNull(_cursorIndexOfCreatedAt)) {
              _item.createdAt = null;
            } else {
              _item.createdAt = _cursor.getString(_cursorIndexOfCreatedAt);
            }
            if (_cursor.isNull(_cursorIndexOfExpiresAt)) {
              _item.expiresAt = null;
            } else {
              _item.expiresAt = _cursor.getString(_cursorIndexOfExpiresAt);
            }
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsDuplicate);
            _item.isDuplicate = _tmp != 0;
            if (_cursor.isNull(_cursorIndexOfOriginalAlertId)) {
              _item.originalAlertId = null;
            } else {
              _item.originalAlertId = _cursor.getString(_cursorIndexOfOriginalAlertId);
            }
            if (_cursor.isNull(_cursorIndexOfLanguage)) {
              _item.language = null;
            } else {
              _item.language = _cursor.getString(_cursorIndexOfLanguage);
            }
            if (_cursor.isNull(_cursorIndexOfTranslatedMessage)) {
              _item.translatedMessage = null;
            } else {
              _item.translatedMessage = _cursor.getString(_cursorIndexOfTranslatedMessage);
            }
            _item.unacknowledgedCount = _cursor.getInt(_cursorIndexOfUnacknowledgedCount);
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
  public LiveData<List<AlertEntity>> getAll() {
    final String _sql = "SELECT * FROM alerts ORDER BY createdAt DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return __db.getInvalidationTracker().createLiveData(new String[] {"alerts"}, false, new Callable<List<AlertEntity>>() {
      @Override
      @Nullable
      public List<AlertEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "district");
          final int _cursorIndexOfSeverity = CursorUtil.getColumnIndexOrThrow(_cursor, "severity");
          final int _cursorIndexOfMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "message");
          final int _cursorIndexOfChannel = CursorUtil.getColumnIndexOrThrow(_cursor, "channel");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfAcknowledgedBy = CursorUtil.getColumnIndexOrThrow(_cursor, "acknowledgedBy");
          final int _cursorIndexOfAcknowledgedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "acknowledgedAt");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfExpiresAt = CursorUtil.getColumnIndexOrThrow(_cursor, "expiresAt");
          final int _cursorIndexOfIsDuplicate = CursorUtil.getColumnIndexOrThrow(_cursor, "isDuplicate");
          final int _cursorIndexOfOriginalAlertId = CursorUtil.getColumnIndexOrThrow(_cursor, "originalAlertId");
          final int _cursorIndexOfLanguage = CursorUtil.getColumnIndexOrThrow(_cursor, "language");
          final int _cursorIndexOfTranslatedMessage = CursorUtil.getColumnIndexOrThrow(_cursor, "translatedMessage");
          final int _cursorIndexOfUnacknowledgedCount = CursorUtil.getColumnIndexOrThrow(_cursor, "unacknowledgedCount");
          final List<AlertEntity> _result = new ArrayList<AlertEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final AlertEntity _item;
            _item = new AlertEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfDistrict)) {
              _item.district = null;
            } else {
              _item.district = _cursor.getString(_cursorIndexOfDistrict);
            }
            if (_cursor.isNull(_cursorIndexOfSeverity)) {
              _item.severity = null;
            } else {
              _item.severity = _cursor.getString(_cursorIndexOfSeverity);
            }
            if (_cursor.isNull(_cursorIndexOfMessage)) {
              _item.message = null;
            } else {
              _item.message = _cursor.getString(_cursorIndexOfMessage);
            }
            if (_cursor.isNull(_cursorIndexOfChannel)) {
              _item.channel = null;
            } else {
              _item.channel = _cursor.getString(_cursorIndexOfChannel);
            }
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _item.status = null;
            } else {
              _item.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfAcknowledgedBy)) {
              _item.acknowledgedBy = null;
            } else {
              _item.acknowledgedBy = _cursor.getString(_cursorIndexOfAcknowledgedBy);
            }
            if (_cursor.isNull(_cursorIndexOfAcknowledgedAt)) {
              _item.acknowledgedAt = null;
            } else {
              _item.acknowledgedAt = _cursor.getString(_cursorIndexOfAcknowledgedAt);
            }
            if (_cursor.isNull(_cursorIndexOfCreatedAt)) {
              _item.createdAt = null;
            } else {
              _item.createdAt = _cursor.getString(_cursorIndexOfCreatedAt);
            }
            if (_cursor.isNull(_cursorIndexOfExpiresAt)) {
              _item.expiresAt = null;
            } else {
              _item.expiresAt = _cursor.getString(_cursorIndexOfExpiresAt);
            }
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfIsDuplicate);
            _item.isDuplicate = _tmp != 0;
            if (_cursor.isNull(_cursorIndexOfOriginalAlertId)) {
              _item.originalAlertId = null;
            } else {
              _item.originalAlertId = _cursor.getString(_cursorIndexOfOriginalAlertId);
            }
            if (_cursor.isNull(_cursorIndexOfLanguage)) {
              _item.language = null;
            } else {
              _item.language = _cursor.getString(_cursorIndexOfLanguage);
            }
            if (_cursor.isNull(_cursorIndexOfTranslatedMessage)) {
              _item.translatedMessage = null;
            } else {
              _item.translatedMessage = _cursor.getString(_cursorIndexOfTranslatedMessage);
            }
            _item.unacknowledgedCount = _cursor.getInt(_cursorIndexOfUnacknowledgedCount);
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
  public LiveData<Integer> getUnacknowledgedCount() {
    final String _sql = "SELECT COUNT(*) FROM alerts WHERE acknowledgedBy IS NULL";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return __db.getInvalidationTracker().createLiveData(new String[] {"alerts"}, false, new Callable<Integer>() {
      @Override
      @Nullable
      public Integer call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final Integer _result;
          if (_cursor.moveToFirst()) {
            final Integer _tmp;
            if (_cursor.isNull(0)) {
              _tmp = null;
            } else {
              _tmp = _cursor.getInt(0);
            }
            _result = _tmp;
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

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
