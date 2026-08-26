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
import com.safesphere.nativeapp.data.entity.DistrictConfigEntity;
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
public final class DistrictConfigDao_Impl implements DistrictConfigDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<DistrictConfigEntity> __insertionAdapterOfDistrictConfigEntity;

  private final EntityDeletionOrUpdateAdapter<DistrictConfigEntity> __updateAdapterOfDistrictConfigEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAll;

  public DistrictConfigDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfDistrictConfigEntity = new EntityInsertionAdapter<DistrictConfigEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `district_configs` (`district`,`floodThreshold`,`warningThreshold`,`criticalThreshold`,`updatedAt`) VALUES (?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final DistrictConfigEntity entity) {
        if (entity.district == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.district);
        }
        statement.bindDouble(2, entity.floodThreshold);
        statement.bindDouble(3, entity.warningThreshold);
        statement.bindDouble(4, entity.criticalThreshold);
        if (entity.updatedAt == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.updatedAt);
        }
      }
    };
    this.__updateAdapterOfDistrictConfigEntity = new EntityDeletionOrUpdateAdapter<DistrictConfigEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `district_configs` SET `district` = ?,`floodThreshold` = ?,`warningThreshold` = ?,`criticalThreshold` = ?,`updatedAt` = ? WHERE `district` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final DistrictConfigEntity entity) {
        if (entity.district == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.district);
        }
        statement.bindDouble(2, entity.floodThreshold);
        statement.bindDouble(3, entity.warningThreshold);
        statement.bindDouble(4, entity.criticalThreshold);
        if (entity.updatedAt == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.updatedAt);
        }
        if (entity.district == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.district);
        }
      }
    };
    this.__preparedStmtOfDeleteAll = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM district_configs";
        return _query;
      }
    };
  }

  @Override
  public void insertAll(final List<DistrictConfigEntity> configs) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfDistrictConfigEntity.insert(configs);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void insert(final DistrictConfigEntity config) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfDistrictConfigEntity.insert(config);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void update(final DistrictConfigEntity config) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __updateAdapterOfDistrictConfigEntity.handle(config);
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
  public LiveData<DistrictConfigEntity> getByDistrict(final String district) {
    final String _sql = "SELECT * FROM district_configs WHERE district = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (district == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, district);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"district_configs"}, false, new Callable<DistrictConfigEntity>() {
      @Override
      @Nullable
      public DistrictConfigEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "district");
          final int _cursorIndexOfFloodThreshold = CursorUtil.getColumnIndexOrThrow(_cursor, "floodThreshold");
          final int _cursorIndexOfWarningThreshold = CursorUtil.getColumnIndexOrThrow(_cursor, "warningThreshold");
          final int _cursorIndexOfCriticalThreshold = CursorUtil.getColumnIndexOrThrow(_cursor, "criticalThreshold");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final DistrictConfigEntity _result;
          if (_cursor.moveToFirst()) {
            _result = new DistrictConfigEntity();
            if (_cursor.isNull(_cursorIndexOfDistrict)) {
              _result.district = null;
            } else {
              _result.district = _cursor.getString(_cursorIndexOfDistrict);
            }
            _result.floodThreshold = _cursor.getDouble(_cursorIndexOfFloodThreshold);
            _result.warningThreshold = _cursor.getDouble(_cursorIndexOfWarningThreshold);
            _result.criticalThreshold = _cursor.getDouble(_cursorIndexOfCriticalThreshold);
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
  public LiveData<List<DistrictConfigEntity>> getAll() {
    final String _sql = "SELECT * FROM district_configs";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return __db.getInvalidationTracker().createLiveData(new String[] {"district_configs"}, false, new Callable<List<DistrictConfigEntity>>() {
      @Override
      @Nullable
      public List<DistrictConfigEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "district");
          final int _cursorIndexOfFloodThreshold = CursorUtil.getColumnIndexOrThrow(_cursor, "floodThreshold");
          final int _cursorIndexOfWarningThreshold = CursorUtil.getColumnIndexOrThrow(_cursor, "warningThreshold");
          final int _cursorIndexOfCriticalThreshold = CursorUtil.getColumnIndexOrThrow(_cursor, "criticalThreshold");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final List<DistrictConfigEntity> _result = new ArrayList<DistrictConfigEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final DistrictConfigEntity _item;
            _item = new DistrictConfigEntity();
            if (_cursor.isNull(_cursorIndexOfDistrict)) {
              _item.district = null;
            } else {
              _item.district = _cursor.getString(_cursorIndexOfDistrict);
            }
            _item.floodThreshold = _cursor.getDouble(_cursorIndexOfFloodThreshold);
            _item.warningThreshold = _cursor.getDouble(_cursorIndexOfWarningThreshold);
            _item.criticalThreshold = _cursor.getDouble(_cursorIndexOfCriticalThreshold);
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
