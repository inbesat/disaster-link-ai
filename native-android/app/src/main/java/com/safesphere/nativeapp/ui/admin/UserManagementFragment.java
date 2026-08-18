package com.safesphere.nativeapp.ui.admin;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.SearchView;
import android.widget.Spinner;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.LiveData;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.data.entity.UserEntity;
import com.safesphere.nativeapp.data.repository.UserRepository;
import com.safesphere.nativeapp.ui.base.BaseFragment;

import java.util.ArrayList;
import java.util.List;

public class UserManagementFragment extends BaseFragment {

    private UserRepository userRepository;
    private RecyclerView usersRecyclerView;
    private SearchView searchView;

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_user_management;
    }

    @Override
    protected void initViews(View view) {
        userRepository = new UserRepository(requireActivity());
        usersRecyclerView = view.findViewById(R.id.usersRecyclerView);
        searchView = view.findViewById(R.id.umSearchView);

        usersRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        loadUsers();

        setupSearch();
    }

    private void loadUsers() {
        userRepository.getAllUsers().observe(getViewLifecycleOwner(), users -> {
            if (users != null) {
                usersRecyclerView.setAdapter(new UserAdapter(new ArrayList<>(users)));
            }
        });
    }

    private void setupSearch() {
        searchView.setOnQueryTextListener(new SearchView.OnQueryTextListener() {
            @Override public boolean onQueryTextSubmit(String query) { return false; }
            @Override public boolean onQueryTextChange(String newText) { return false; }
        });
    }

    static class UserAdapter extends RecyclerView.Adapter<UserAdapter.VH> {
        List<UserEntity> items = new ArrayList<>();
        UserAdapter(List<UserEntity> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_user_card, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            UserEntity u = items.get(pos);
            h.initials.setText(getInitials(u.name));
            h.name.setText(u.name);
            h.email.setText(u.email);
            h.org.setText(u.organization);
            h.district.setText(u.assignedDistrict);
            h.role.setText(u.role.replace("_", " "));
            h.role.setChipBackgroundColorResource(
                    u.role.equals("super_admin") ? R.color.accentAdmin :
                            u.role.equals("district_admin") ? R.color.colorPrimary :
                                    u.role.equals("field_responder") ? R.color.colorWarning : R.color.textMuted
            );
            h.status.setText(u.status.toUpperCase());
            h.status.setChipBackgroundColorResource(
                    u.status.equals("active") ? R.color.colorSuccess : R.color.colorCritical
            );
            h.lastActive.setText(u.lastActive);
            h.action.setText(u.status.equals("active") ? "Deactivate" : "Reactivate");
            h.action.setOnClickListener(v -> {
                u.status = u.status.equals("active") ? "inactive" : "active";
                notifyItemChanged(pos);
                Toast.makeText(v.getContext(), "User " + u.status, Toast.LENGTH_SHORT).show();
            });
        }
        @Override public int getItemCount() { return items.size(); }
        private String getInitials(String name) {
            String[] parts = name.split(" ");
            if (parts.length >= 2) return (parts[0].charAt(0) + "" + parts[1].charAt(0)).toUpperCase();
            return name.substring(0, Math.min(2, name.length())).toUpperCase();
        }
        static class VH extends RecyclerView.ViewHolder { TextView initials, name, email, org, district, lastActive, action; com.google.android.material.chip.Chip role, status; VH(View v) { super(v); initials = v.findViewById(R.id.userInitials); name = v.findViewById(R.id.userName); email = v.findViewById(R.id.userEmail); org = v.findViewById(R.id.userOrg); district = v.findViewById(R.id.userDistrict); role = v.findViewById(R.id.userRole); status = v.findViewById(R.id.userStatus); lastActive = v.findViewById(R.id.userLastActive); action = v.findViewById(R.id.userAction); } }
    }
}