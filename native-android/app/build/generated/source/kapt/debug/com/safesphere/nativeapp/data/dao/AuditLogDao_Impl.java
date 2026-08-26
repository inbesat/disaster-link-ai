package com.safesphere.nativeapp.data.dao;

import android.database.Cursor;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.LiveData;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.SharedSQLiteStatement;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import com.safesphere.nativeapp.data.entity.AuditLogEntity;
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
public final class AuditLogDao_Impl implements AuditLogDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<AuditLogEntity> __insertionAdapterOfAuditLogEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAll;

  public AuditLogDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfAuditLogEntity = new EntityInsertionAdapter<AuditLogEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `audit_logs` (`id`,`action`,`actor`,`resource`,`ip`,`severity`,`timestamp`) VALUES (?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final AuditLogEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        if (entity.action == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.action);
        }
        if (entity.actor == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.actor);
        }
        if (entity.resource == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.resource);
        }
        if (entity.ip == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.ip);
        }
        if (entity.severity == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.severity);
        }
        if (entity.timestamp == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.timestamp);
        }
      }
    };
    this.__preparedStmtOfDeleteAll = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM audit_logs";
        return _query;
      }
    };
  }

  @Override
  public void insertAll(final List<AuditLogEntity> logs) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfAuditLogEntity.insert(logs);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void insert(final AuditLogEntity log) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfAuditLogEntity.insert(log);
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
  public LiveData<List<AuditLogEntity>> getAll() {
    final String _sql = "SELECT * FROM audit_logs ORDER BY timestamp DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return __db.getInvalidationTracker().createLiveData(new String[] {"audit_logs"}, false, new Callable<List<AuditLogEntity>>() {
      @Override
      @Nullable
      public List<AuditLogEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfAction = CursorUtil.getColumnIndexOrThrow(_cursor, "action");
          final int _cursorIndexOfActor = CursorUtil.getColumnIndexOrThrow(_cursor, "actor");
          final int _cursorIndexOfResource = CursorUtil.getColumnIndexOrThrow(_cursor, "resource");
          final int _cursorIndexOfIp = CursorUtil.getColumnIndexOrThrow(_cursor, "ip");
          final int _cursorIndexOfSeverity = CursorUtil.getColumnIndexOrThrow(_cursor, "severity");
          final int _cursorIndexOfTimestamp = CursorUtil.getColumnIndexOrThrow(_cursor, "timestamp");
          final List<AuditLogEntity> _result = new ArrayList<AuditLogEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final AuditLogEntity _item;
            _item = new AuditLogEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfAction)) {
              _item.action = null;
            } else {
              _item.action = _cursor.getString(_cursorIndexOfAction);
            }
            if (_cursor.isNull(_cursorIndexOfActor)) {
              _item.actor = null;
            } else {
              _item.actor = _cursor.getString(_cursorIndexOfActor);
            }
            if (_cursor.isNull(_cursorIndexOfResource)) {
              _item.resource = null;
            } else {
              _item.resource = _cursor.getString(_cursorIndexOfResource);
            }
            if (_cursor.isNull(_cursorIndexOfIp)) {
              _item.ip = null;
            } else {
              _item.ip = _cursor.getString(_cursorIndexOfIp);
            }
            if (_cursor.isNull(_cursorIndexOfSeverity)) {
              _item.severity = null;
            } else {
              _item.severity = _cursor.getString(_cursorIndexOfSeverity);
            }
            if (_cursor.isNull(_cursorIndexOfTimestamp)) {
              _item.timestamp = null;
            } else {
              _item.timestamp = _cursor.getString(_cursorIndexOfTimestamp);
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
  public LiveData<List<AuditLogEntity>> getBySeverity(final String severity) {
    final String _sql = "SELECT * FROM audit_logs WHERE severity = ? ORDER BY timestamp DESC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (severity == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, severity);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"audit_logs"}, false, new Callable<List<AuditLogEntity>>() {
      @Override
      @Nullable
      public List<AuditLogEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfAction = CursorUtil.getColumnIndexOrThrow(_cursor, "action");
          final int _cursorIndexOfActor = CursorUtil.getColumnIndexOrThrow(_cursor, "actor");
          final int _cursorIndexOfResource = CursorUtil.getColumnIndexOrThrow(_cursor, "resource");
          final int _cursorIndexOfIp = CursorUtil.getColumnIndexOrThrow(_cursor, "ip");
          final int _cursorIndexOfSeverity = CursorUtil.getColumnIndexOrThrow(_cursor, "severity");
          final int _cursorIndexOfTimestamp = CursorUtil.getColumnIndexOrThrow(_cursor, "timestamp");
          final List<AuditLogEntity> _result = new ArrayList<AuditLogEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final AuditLogEntity _item;
            _item = new AuditLogEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfAction)) {
              _item.action = null;
            } else {
              _item.action = _cursor.getString(_cursorIndexOfAction);
            }
            if (_cursor.isNull(_cursorIndexOfActor)) {
              _item.actor = null;
            } else {
              _item.actor = _cursor.getString(_cursorIndexOfActor);
            }
            if (_cursor.isNull(_cursorIndexOfResource)) {
              _item.resource = null;
            } else {
              _item.resource = _cursor.getString(_cursorIndexOfResource);
            }
            if (_cursor.isNull(_cursorIndexOfIp)) {
              _item.ip = null;
            } else {
              _item.ip = _cursor.getString(_cursorIndexOfIp);
            }
            if (_cursor.isNull(_cursorIndexOfSeverity)) {
              _item.severity = null;
            } else {
              _item.severity = _cursor.getString(_cursorIndexOfSeverity);
            }
            if (_cursor.isNull(_cursorIndexOfTimestamp)) {
              _item.timestamp = null;
            } else {
              _item.timestamp = _cursor.getString(_cursorIndexOfTimestamp);
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
