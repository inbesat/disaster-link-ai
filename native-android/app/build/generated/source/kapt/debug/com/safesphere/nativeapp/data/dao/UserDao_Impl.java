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
import com.safesphere.nativeapp.data.entity.UserEntity;
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
public final class UserDao_Impl implements UserDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<UserEntity> __insertionAdapterOfUserEntity;

  private final EntityDeletionOrUpdateAdapter<UserEntity> __updateAdapterOfUserEntity;

  private final SharedSQLiteStatement __preparedStmtOfDeleteAll;

  public UserDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfUserEntity = new EntityInsertionAdapter<UserEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `users` (`id`,`email`,`name`,`phone`,`role`,`organization`,`assignedDistrict`,`status`,`lastActive`,`avatarUrl`,`passwordHash`,`createdAt`,`updatedAt`,`guestMode`,`pwdPriority`,`pwdDetails`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final UserEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        if (entity.email == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.email);
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
        if (entity.role == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.role);
        }
        if (entity.organization == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.organization);
        }
        if (entity.assignedDistrict == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.assignedDistrict);
        }
        if (entity.status == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.status);
        }
        if (entity.lastActive == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.lastActive);
        }
        if (entity.avatarUrl == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.avatarUrl);
        }
        if (entity.passwordHash == null) {
          statement.bindNull(11);
        } else {
          statement.bindString(11, entity.passwordHash);
        }
        if (entity.createdAt == null) {
          statement.bindNull(12);
        } else {
          statement.bindString(12, entity.createdAt);
        }
        if (entity.updatedAt == null) {
          statement.bindNull(13);
        } else {
          statement.bindString(13, entity.updatedAt);
        }
        final int _tmp = entity.guestMode ? 1 : 0;
        statement.bindLong(14, _tmp);
        final int _tmp_1 = entity.pwdPriority ? 1 : 0;
        statement.bindLong(15, _tmp_1);
        if (entity.pwdDetails == null) {
          statement.bindNull(16);
        } else {
          statement.bindString(16, entity.pwdDetails);
        }
      }
    };
    this.__updateAdapterOfUserEntity = new EntityDeletionOrUpdateAdapter<UserEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `users` SET `id` = ?,`email` = ?,`name` = ?,`phone` = ?,`role` = ?,`organization` = ?,`assignedDistrict` = ?,`status` = ?,`lastActive` = ?,`avatarUrl` = ?,`passwordHash` = ?,`createdAt` = ?,`updatedAt` = ?,`guestMode` = ?,`pwdPriority` = ?,`pwdDetails` = ? WHERE `id` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          final UserEntity entity) {
        if (entity.id == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.id);
        }
        if (entity.email == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.email);
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
        if (entity.role == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.role);
        }
        if (entity.organization == null) {
          statement.bindNull(6);
        } else {
          statement.bindString(6, entity.organization);
        }
        if (entity.assignedDistrict == null) {
          statement.bindNull(7);
        } else {
          statement.bindString(7, entity.assignedDistrict);
        }
        if (entity.status == null) {
          statement.bindNull(8);
        } else {
          statement.bindString(8, entity.status);
        }
        if (entity.lastActive == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.lastActive);
        }
        if (entity.avatarUrl == null) {
          statement.bindNull(10);
        } else {
          statement.bindString(10, entity.avatarUrl);
        }
        if (entity.passwordHash == null) {
          statement.bindNull(11);
        } else {
          statement.bindString(11, entity.passwordHash);
        }
        if (entity.createdAt == null) {
          statement.bindNull(12);
        } else {
          statement.bindString(12, entity.createdAt);
        }
        if (entity.updatedAt == null) {
          statement.bindNull(13);
        } else {
          statement.bindString(13, entity.updatedAt);
        }
        final int _tmp = entity.guestMode ? 1 : 0;
        statement.bindLong(14, _tmp);
        final int _tmp_1 = entity.pwdPriority ? 1 : 0;
        statement.bindLong(15, _tmp_1);
        if (entity.pwdDetails == null) {
          statement.bindNull(16);
        } else {
          statement.bindString(16, entity.pwdDetails);
        }
        if (entity.id == null) {
          statement.bindNull(17);
        } else {
          statement.bindString(17, entity.id);
        }
      }
    };
    this.__preparedStmtOfDeleteAll = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM users";
        return _query;
      }
    };
  }

  @Override
  public void insertAll(final List<UserEntity> users) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfUserEntity.insert(users);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void insert(final UserEntity user) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfUserEntity.insert(user);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void update(final UserEntity user) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __updateAdapterOfUserEntity.handle(user);
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
  public LiveData<UserEntity> getById(final String id) {
    final String _sql = "SELECT * FROM users WHERE id = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (id == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, id);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"users"}, false, new Callable<UserEntity>() {
      @Override
      @Nullable
      public UserEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfEmail = CursorUtil.getColumnIndexOrThrow(_cursor, "email");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfPhone = CursorUtil.getColumnIndexOrThrow(_cursor, "phone");
          final int _cursorIndexOfRole = CursorUtil.getColumnIndexOrThrow(_cursor, "role");
          final int _cursorIndexOfOrganization = CursorUtil.getColumnIndexOrThrow(_cursor, "organization");
          final int _cursorIndexOfAssignedDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedDistrict");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfLastActive = CursorUtil.getColumnIndexOrThrow(_cursor, "lastActive");
          final int _cursorIndexOfAvatarUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "avatarUrl");
          final int _cursorIndexOfPasswordHash = CursorUtil.getColumnIndexOrThrow(_cursor, "passwordHash");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfGuestMode = CursorUtil.getColumnIndexOrThrow(_cursor, "guestMode");
          final int _cursorIndexOfPwdPriority = CursorUtil.getColumnIndexOrThrow(_cursor, "pwdPriority");
          final int _cursorIndexOfPwdDetails = CursorUtil.getColumnIndexOrThrow(_cursor, "pwdDetails");
          final UserEntity _result;
          if (_cursor.moveToFirst()) {
            _result = new UserEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _result.id = null;
            } else {
              _result.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfEmail)) {
              _result.email = null;
            } else {
              _result.email = _cursor.getString(_cursorIndexOfEmail);
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
            if (_cursor.isNull(_cursorIndexOfRole)) {
              _result.role = null;
            } else {
              _result.role = _cursor.getString(_cursorIndexOfRole);
            }
            if (_cursor.isNull(_cursorIndexOfOrganization)) {
              _result.organization = null;
            } else {
              _result.organization = _cursor.getString(_cursorIndexOfOrganization);
            }
            if (_cursor.isNull(_cursorIndexOfAssignedDistrict)) {
              _result.assignedDistrict = null;
            } else {
              _result.assignedDistrict = _cursor.getString(_cursorIndexOfAssignedDistrict);
            }
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _result.status = null;
            } else {
              _result.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfLastActive)) {
              _result.lastActive = null;
            } else {
              _result.lastActive = _cursor.getString(_cursorIndexOfLastActive);
            }
            if (_cursor.isNull(_cursorIndexOfAvatarUrl)) {
              _result.avatarUrl = null;
            } else {
              _result.avatarUrl = _cursor.getString(_cursorIndexOfAvatarUrl);
            }
            if (_cursor.isNull(_cursorIndexOfPasswordHash)) {
              _result.passwordHash = null;
            } else {
              _result.passwordHash = _cursor.getString(_cursorIndexOfPasswordHash);
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
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfGuestMode);
            _result.guestMode = _tmp != 0;
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfPwdPriority);
            _result.pwdPriority = _tmp_1 != 0;
            if (_cursor.isNull(_cursorIndexOfPwdDetails)) {
              _result.pwdDetails = null;
            } else {
              _result.pwdDetails = _cursor.getString(_cursorIndexOfPwdDetails);
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
  public LiveData<UserEntity> getByEmail(final String email) {
    final String _sql = "SELECT * FROM users WHERE email = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (email == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, email);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"users"}, false, new Callable<UserEntity>() {
      @Override
      @Nullable
      public UserEntity call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfEmail = CursorUtil.getColumnIndexOrThrow(_cursor, "email");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfPhone = CursorUtil.getColumnIndexOrThrow(_cursor, "phone");
          final int _cursorIndexOfRole = CursorUtil.getColumnIndexOrThrow(_cursor, "role");
          final int _cursorIndexOfOrganization = CursorUtil.getColumnIndexOrThrow(_cursor, "organization");
          final int _cursorIndexOfAssignedDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedDistrict");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfLastActive = CursorUtil.getColumnIndexOrThrow(_cursor, "lastActive");
          final int _cursorIndexOfAvatarUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "avatarUrl");
          final int _cursorIndexOfPasswordHash = CursorUtil.getColumnIndexOrThrow(_cursor, "passwordHash");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfGuestMode = CursorUtil.getColumnIndexOrThrow(_cursor, "guestMode");
          final int _cursorIndexOfPwdPriority = CursorUtil.getColumnIndexOrThrow(_cursor, "pwdPriority");
          final int _cursorIndexOfPwdDetails = CursorUtil.getColumnIndexOrThrow(_cursor, "pwdDetails");
          final UserEntity _result;
          if (_cursor.moveToFirst()) {
            _result = new UserEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _result.id = null;
            } else {
              _result.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfEmail)) {
              _result.email = null;
            } else {
              _result.email = _cursor.getString(_cursorIndexOfEmail);
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
            if (_cursor.isNull(_cursorIndexOfRole)) {
              _result.role = null;
            } else {
              _result.role = _cursor.getString(_cursorIndexOfRole);
            }
            if (_cursor.isNull(_cursorIndexOfOrganization)) {
              _result.organization = null;
            } else {
              _result.organization = _cursor.getString(_cursorIndexOfOrganization);
            }
            if (_cursor.isNull(_cursorIndexOfAssignedDistrict)) {
              _result.assignedDistrict = null;
            } else {
              _result.assignedDistrict = _cursor.getString(_cursorIndexOfAssignedDistrict);
            }
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _result.status = null;
            } else {
              _result.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfLastActive)) {
              _result.lastActive = null;
            } else {
              _result.lastActive = _cursor.getString(_cursorIndexOfLastActive);
            }
            if (_cursor.isNull(_cursorIndexOfAvatarUrl)) {
              _result.avatarUrl = null;
            } else {
              _result.avatarUrl = _cursor.getString(_cursorIndexOfAvatarUrl);
            }
            if (_cursor.isNull(_cursorIndexOfPasswordHash)) {
              _result.passwordHash = null;
            } else {
              _result.passwordHash = _cursor.getString(_cursorIndexOfPasswordHash);
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
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfGuestMode);
            _result.guestMode = _tmp != 0;
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfPwdPriority);
            _result.pwdPriority = _tmp_1 != 0;
            if (_cursor.isNull(_cursorIndexOfPwdDetails)) {
              _result.pwdDetails = null;
            } else {
              _result.pwdDetails = _cursor.getString(_cursorIndexOfPwdDetails);
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
  public LiveData<List<UserEntity>> getByRole(final String role) {
    final String _sql = "SELECT * FROM users WHERE role = ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (role == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, role);
    }
    return __db.getInvalidationTracker().createLiveData(new String[] {"users"}, false, new Callable<List<UserEntity>>() {
      @Override
      @Nullable
      public List<UserEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfEmail = CursorUtil.getColumnIndexOrThrow(_cursor, "email");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfPhone = CursorUtil.getColumnIndexOrThrow(_cursor, "phone");
          final int _cursorIndexOfRole = CursorUtil.getColumnIndexOrThrow(_cursor, "role");
          final int _cursorIndexOfOrganization = CursorUtil.getColumnIndexOrThrow(_cursor, "organization");
          final int _cursorIndexOfAssignedDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedDistrict");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfLastActive = CursorUtil.getColumnIndexOrThrow(_cursor, "lastActive");
          final int _cursorIndexOfAvatarUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "avatarUrl");
          final int _cursorIndexOfPasswordHash = CursorUtil.getColumnIndexOrThrow(_cursor, "passwordHash");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfGuestMode = CursorUtil.getColumnIndexOrThrow(_cursor, "guestMode");
          final int _cursorIndexOfPwdPriority = CursorUtil.getColumnIndexOrThrow(_cursor, "pwdPriority");
          final int _cursorIndexOfPwdDetails = CursorUtil.getColumnIndexOrThrow(_cursor, "pwdDetails");
          final List<UserEntity> _result = new ArrayList<UserEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final UserEntity _item;
            _item = new UserEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfEmail)) {
              _item.email = null;
            } else {
              _item.email = _cursor.getString(_cursorIndexOfEmail);
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
            if (_cursor.isNull(_cursorIndexOfRole)) {
              _item.role = null;
            } else {
              _item.role = _cursor.getString(_cursorIndexOfRole);
            }
            if (_cursor.isNull(_cursorIndexOfOrganization)) {
              _item.organization = null;
            } else {
              _item.organization = _cursor.getString(_cursorIndexOfOrganization);
            }
            if (_cursor.isNull(_cursorIndexOfAssignedDistrict)) {
              _item.assignedDistrict = null;
            } else {
              _item.assignedDistrict = _cursor.getString(_cursorIndexOfAssignedDistrict);
            }
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _item.status = null;
            } else {
              _item.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfLastActive)) {
              _item.lastActive = null;
            } else {
              _item.lastActive = _cursor.getString(_cursorIndexOfLastActive);
            }
            if (_cursor.isNull(_cursorIndexOfAvatarUrl)) {
              _item.avatarUrl = null;
            } else {
              _item.avatarUrl = _cursor.getString(_cursorIndexOfAvatarUrl);
            }
            if (_cursor.isNull(_cursorIndexOfPasswordHash)) {
              _item.passwordHash = null;
            } else {
              _item.passwordHash = _cursor.getString(_cursorIndexOfPasswordHash);
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
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfGuestMode);
            _item.guestMode = _tmp != 0;
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfPwdPriority);
            _item.pwdPriority = _tmp_1 != 0;
            if (_cursor.isNull(_cursorIndexOfPwdDetails)) {
              _item.pwdDetails = null;
            } else {
              _item.pwdDetails = _cursor.getString(_cursorIndexOfPwdDetails);
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
  public LiveData<List<UserEntity>> getAll() {
    final String _sql = "SELECT * FROM users";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return __db.getInvalidationTracker().createLiveData(new String[] {"users"}, false, new Callable<List<UserEntity>>() {
      @Override
      @Nullable
      public List<UserEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfEmail = CursorUtil.getColumnIndexOrThrow(_cursor, "email");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfPhone = CursorUtil.getColumnIndexOrThrow(_cursor, "phone");
          final int _cursorIndexOfRole = CursorUtil.getColumnIndexOrThrow(_cursor, "role");
          final int _cursorIndexOfOrganization = CursorUtil.getColumnIndexOrThrow(_cursor, "organization");
          final int _cursorIndexOfAssignedDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedDistrict");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfLastActive = CursorUtil.getColumnIndexOrThrow(_cursor, "lastActive");
          final int _cursorIndexOfAvatarUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "avatarUrl");
          final int _cursorIndexOfPasswordHash = CursorUtil.getColumnIndexOrThrow(_cursor, "passwordHash");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfGuestMode = CursorUtil.getColumnIndexOrThrow(_cursor, "guestMode");
          final int _cursorIndexOfPwdPriority = CursorUtil.getColumnIndexOrThrow(_cursor, "pwdPriority");
          final int _cursorIndexOfPwdDetails = CursorUtil.getColumnIndexOrThrow(_cursor, "pwdDetails");
          final List<UserEntity> _result = new ArrayList<UserEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final UserEntity _item;
            _item = new UserEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfEmail)) {
              _item.email = null;
            } else {
              _item.email = _cursor.getString(_cursorIndexOfEmail);
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
            if (_cursor.isNull(_cursorIndexOfRole)) {
              _item.role = null;
            } else {
              _item.role = _cursor.getString(_cursorIndexOfRole);
            }
            if (_cursor.isNull(_cursorIndexOfOrganization)) {
              _item.organization = null;
            } else {
              _item.organization = _cursor.getString(_cursorIndexOfOrganization);
            }
            if (_cursor.isNull(_cursorIndexOfAssignedDistrict)) {
              _item.assignedDistrict = null;
            } else {
              _item.assignedDistrict = _cursor.getString(_cursorIndexOfAssignedDistrict);
            }
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _item.status = null;
            } else {
              _item.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfLastActive)) {
              _item.lastActive = null;
            } else {
              _item.lastActive = _cursor.getString(_cursorIndexOfLastActive);
            }
            if (_cursor.isNull(_cursorIndexOfAvatarUrl)) {
              _item.avatarUrl = null;
            } else {
              _item.avatarUrl = _cursor.getString(_cursorIndexOfAvatarUrl);
            }
            if (_cursor.isNull(_cursorIndexOfPasswordHash)) {
              _item.passwordHash = null;
            } else {
              _item.passwordHash = _cursor.getString(_cursorIndexOfPasswordHash);
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
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfGuestMode);
            _item.guestMode = _tmp != 0;
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfPwdPriority);
            _item.pwdPriority = _tmp_1 != 0;
            if (_cursor.isNull(_cursorIndexOfPwdDetails)) {
              _item.pwdDetails = null;
            } else {
              _item.pwdDetails = _cursor.getString(_cursorIndexOfPwdDetails);
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
  public LiveData<List<UserEntity>> getGuests() {
    final String _sql = "SELECT * FROM users WHERE guestMode = 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    return __db.getInvalidationTracker().createLiveData(new String[] {"users"}, false, new Callable<List<UserEntity>>() {
      @Override
      @Nullable
      public List<UserEntity> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfId = CursorUtil.getColumnIndexOrThrow(_cursor, "id");
          final int _cursorIndexOfEmail = CursorUtil.getColumnIndexOrThrow(_cursor, "email");
          final int _cursorIndexOfName = CursorUtil.getColumnIndexOrThrow(_cursor, "name");
          final int _cursorIndexOfPhone = CursorUtil.getColumnIndexOrThrow(_cursor, "phone");
          final int _cursorIndexOfRole = CursorUtil.getColumnIndexOrThrow(_cursor, "role");
          final int _cursorIndexOfOrganization = CursorUtil.getColumnIndexOrThrow(_cursor, "organization");
          final int _cursorIndexOfAssignedDistrict = CursorUtil.getColumnIndexOrThrow(_cursor, "assignedDistrict");
          final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
          final int _cursorIndexOfLastActive = CursorUtil.getColumnIndexOrThrow(_cursor, "lastActive");
          final int _cursorIndexOfAvatarUrl = CursorUtil.getColumnIndexOrThrow(_cursor, "avatarUrl");
          final int _cursorIndexOfPasswordHash = CursorUtil.getColumnIndexOrThrow(_cursor, "passwordHash");
          final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
          final int _cursorIndexOfUpdatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "updatedAt");
          final int _cursorIndexOfGuestMode = CursorUtil.getColumnIndexOrThrow(_cursor, "guestMode");
          final int _cursorIndexOfPwdPriority = CursorUtil.getColumnIndexOrThrow(_cursor, "pwdPriority");
          final int _cursorIndexOfPwdDetails = CursorUtil.getColumnIndexOrThrow(_cursor, "pwdDetails");
          final List<UserEntity> _result = new ArrayList<UserEntity>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final UserEntity _item;
            _item = new UserEntity();
            if (_cursor.isNull(_cursorIndexOfId)) {
              _item.id = null;
            } else {
              _item.id = _cursor.getString(_cursorIndexOfId);
            }
            if (_cursor.isNull(_cursorIndexOfEmail)) {
              _item.email = null;
            } else {
              _item.email = _cursor.getString(_cursorIndexOfEmail);
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
            if (_cursor.isNull(_cursorIndexOfRole)) {
              _item.role = null;
            } else {
              _item.role = _cursor.getString(_cursorIndexOfRole);
            }
            if (_cursor.isNull(_cursorIndexOfOrganization)) {
              _item.organization = null;
            } else {
              _item.organization = _cursor.getString(_cursorIndexOfOrganization);
            }
            if (_cursor.isNull(_cursorIndexOfAssignedDistrict)) {
              _item.assignedDistrict = null;
            } else {
              _item.assignedDistrict = _cursor.getString(_cursorIndexOfAssignedDistrict);
            }
            if (_cursor.isNull(_cursorIndexOfStatus)) {
              _item.status = null;
            } else {
              _item.status = _cursor.getString(_cursorIndexOfStatus);
            }
            if (_cursor.isNull(_cursorIndexOfLastActive)) {
              _item.lastActive = null;
            } else {
              _item.lastActive = _cursor.getString(_cursorIndexOfLastActive);
            }
            if (_cursor.isNull(_cursorIndexOfAvatarUrl)) {
              _item.avatarUrl = null;
            } else {
              _item.avatarUrl = _cursor.getString(_cursorIndexOfAvatarUrl);
            }
            if (_cursor.isNull(_cursorIndexOfPasswordHash)) {
              _item.passwordHash = null;
            } else {
              _item.passwordHash = _cursor.getString(_cursorIndexOfPasswordHash);
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
            final int _tmp;
            _tmp = _cursor.getInt(_cursorIndexOfGuestMode);
            _item.guestMode = _tmp != 0;
            final int _tmp_1;
            _tmp_1 = _cursor.getInt(_cursorIndexOfPwdPriority);
            _item.pwdPriority = _tmp_1 != 0;
            if (_cursor.isNull(_cursorIndexOfPwdDetails)) {
              _item.pwdDetails = null;
            } else {
              _item.pwdDetails = _cursor.getString(_cursorIndexOfPwdDetails);
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
