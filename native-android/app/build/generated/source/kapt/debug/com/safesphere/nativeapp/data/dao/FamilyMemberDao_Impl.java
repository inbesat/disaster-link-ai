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
import com.safesphere.nativeapp.data.entity.FamilyMemberEntity;
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
public final class FamilyMemberDao_Impl implements FamilyMemberDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<FamilyMemberEntity> __insertionAdapterOfFamilyMemberEntity;

  private final EntityDeletionOrUpdateAdapter<FamilyMemberEntity> __updateAdapterOfFamilyMemberEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteByUserId;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAll;

  public FamilyMemberDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfFamilyMemberEntity = new EntityInsertionAdapter<FamilyMemberEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `family_members` (`id`,`userId`,`name`,`phone`,`relation`,`lat`,`lng`,`status`,`lastSeen`,`createdAt`) VALUES (?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final FamilyMemberEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        if (entity.userId == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.userId);
        }
        if (entity.name == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.name);
        }
        if (entity.phone == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.phone);
        }
        if (entity.relation == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.relation);
        }
        statement.bindDouble(6, entity.lat);
        statement.bindDouble(7, entity.lng);
        if (entity.status == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.status);
        }
        if (entity.lastSeen == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.lastSeen);
        }
        if (entity.createdAt == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.createdAt);
        }
      }
    };
    this.__updateAdapterOfFamilyMemberEntity = new EntityDeletionOrUpdateAdapter<FamilyMemberEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `family_members` SET `id` = ?,`userId` = ?,`name` = ?,`phone` = ?,`relation` = ?,`lat` = ?,`lng` = ?,`status` = ?,`lastSeen` = ?,`createdAt` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final FamilyMemberEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        if (entity.userId == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.userId);
        }
        if (entity.name == null) {
          statement.bindNull(3);
        } else {
          statement.bindString(3, entity.name);
        }
        if (entity.phone == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.phone);
        }
        if (entity.relation == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.relation);
        }
        statement.bindDouble(6, entity.lat);
        statement.bindDouble(7, entity.lng);
        if (entity.status == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.status);
        }
        if (entity.lastSeen == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.lastSeen);
        }
        if (entity.createdAt == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.createdAt);
        }
        if (entity.id == null) {
          statement.bindNull(11);
        } else {
          statement.bindString(11, entity.id);
        }
      }
    };
    this.__preparedStmtOfDeleteByUserId = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM family_members WHERE userId = ?";
        return _query;
      }
    };
    this.__preparedStmtOfDeleteAll = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM family_members";
        return _query;
      }
    };
  }

  @Override
  public void insertAll(final List<FamilyMemberEntity> members) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfFamilyMemberEntity.insert(members);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void insert(final FamilyMemberEntity member) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfFamilyMemberEntity.insert(member);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void update(final FamilyMemberEntity member) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __updateAdapterOfFamilyMemberEntity.handle(member);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void deleteByUserId(final String userId) {
    __db.assertNotSuspendingTransaction();
    final SupportSQLiteStatement _stmt = __preparedStmtOfDeleteByUserId.acquire();
    int _argIndex = 1;
    if (userId == null) {
      _stmt.bindNull(_argIndex);
    } else {
      _stmt.bindString(_argIndex, userId);
    }
    try {
      __db.beginTransaction();
      try {
        _stmt.executeUpdateDelete();
        __db.setTransactionSuccessful();
      } finally {
        __db.endTransaction();
      }
    } finally {
      __preparedStmtOfDeleteByUserId.release(_stmt);
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
  public LiveData<List<FamilyMemberEntity>> getByUserId(final String userId) {
    final String _sql = "SELECT * FROM family_members WHERE userId = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (userId == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, userId);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"family_members"}, false, new Callable<List<FamilyMemberEntity>>() {
      @Override
      @Nullable
      public List<FamilyMemberEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "userId");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfPhone = CursorUtil.getColumnIndexOrThrow(_cursor, "phone");
          final int _cursorIndexOfRelation = CursorUtil.getColumnIndexOrThrow(_cursor, "relation");
          final int _cursorIndexOfLat = CursorUtil.getColumnIndexOrThrow(_cursor, "lat");
          final int _cursorIndexOfLng = CursorUtil.getColumnIndexOrThrow(_cursor, "lng");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfLastSeen = CursorUtil.getColumnIndexOrThrow(_cursor, "lastSeen");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final List<FamilyMemberEntity> _result = new ArrayList<FamilyMemberEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final FamilyMemberEntity _item;
            _item = new FamilyMemberEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfUserId)) {
              _item.userId = null;
            } else {
              _item.userId = _cursor.getString(_cursorIndexOfUserId);
            }
            if (_cursor.isNull(_cursorIndexOfName)) {
              _item.name = null;
            } else {
              _item.name = _cursor.getString(_cursorIndexOfName);
            }
            if (_cursor.isNull(_cursorIndexOfPhone)) {
              _item.phone = null;
            } else {
              _item.phone = _cursor.getString(_cursorIndexOfPhone);
            }
            if (_cursor.isNull(_cursorIndexOfRelation)) {
              _item.relation = null;
            } else {
              _item.relation = _cursor.getString(_cursorIndexOfRelation);
            }
            _item.lat = _cursor.getDouble(_cursorIndexOfLat);
            _item.lng = _cursor.getDouble(_cursorIndexOfLng);
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _item.status = null;
            } else {
              _item.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfLastSeen)) {
              _item.lastSeen = null;
            } else {
              _item.lastSeen = _cursor.getString(_cursorIndexOfLastSeen);
            }
            if (_cursor.isNull(_cursorIndexOfCreatedAt)) {
              _item.createdAt = null;
            } else {
              _item.createdAt = _cursor.getString(_cursorIndexOfCreatedAt);
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
  public LiveData<FamilyMemberEntity> getById(final String id) {
    final String _sql = "SELECT * FROM family_members WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (id == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, id);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"family_members"}, false, new Callable<FamilyMemberEntity>() {
      @Override
      @Nullable
      public FamilyMemberEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfUserId = CursorUtil.getColumnIndexOrThrow(_cursor, "userId");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfPhone = CursorUtil.getColumnIndexOrThrow(_cursor, "phone");
          final int _cursorIndexOfRelation = CursorUtil.getColumnIndexOrThrow(_cursor, "relation");
          final int _cursorIndexOfLat = CursorUtil.getColumnIndexOrThrow(_cursor, "lat");
          final int _cursorIndexOfLng = CursorUtil.getColumnIndexOrThrow(_cursor, "lng");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfLastSeen = CursorUtil.getColumnIndexOrThrow(_cursor, "lastSeen");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final FamilyMemberEntity _result;
          if (_cursor.moveToFirst()) {
            _result = new FamilyMemberEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _result.id = null;
            } else {
              _result.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfUserId)) {
              _result.userId = null;
            } else {
              _result.userId = _cursor.getString(_cursorIndexOfUserId);
            }
            if (_cursor.isNull(_cursorIndexOfName)) {
              _result.name = null;
            } else {
              _result.name = _cursor.getString(_cursorIndexOfName);
            }
            if (_cursor.isNull(_cursorIndexOfPhone)) {
              _result.phone = null;
            } else {
              _result.phone = _cursor.getString(_cursorIndexOfPhone);
            }
            if (_cursor.isNull(_cursorIndexOfRelation)) {
              _result.relation = null;
            } else {
              _result.relation = _cursor.getString(_cursorIndexOfRelation);
            }
            _result.lat = _cursor.getDouble(_cursorIndexOfLat);
            _result.lng = _cursor.getDouble(_cursorIndexOfLng);
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _result.status = null;
            } else {
              _result.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfLastSeen)) {
              _result.lastSeen = null;
            } else {
              _result.lastSeen = _cursor.getString(_cursorIndexOfLastSeen);
            }
            if (_cursor.isNull(_cursorIndexOfCreatedAt)) {
              _result.createdAt = null;
            } else {
              _result.createdAt = _cursor.getString(_cursorIndexOfCreatedAt);
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

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
