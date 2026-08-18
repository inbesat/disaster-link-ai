package com.safesphere.nativeapp.ui.citizen;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.GridLayout;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.google.android.material.card.MaterialCardView;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.data.entity.ShelterEntity;
import com.safesphere.nativeapp.data.repository.ShelterRepository;
import com.safesphere.nativeapp.ui.base.BaseFragment;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class CitizenDashboardFragment extends BaseFragment {

    private ShelterRepository shelterRepository;
    private TextView safetyStatusValue;
    private TextView safetyStatusSubtitle;
    private Button safetyActionButton;
    private RecyclerView forecastRecyclerView;
    private RecyclerView familyRecyclerView;
    private RecyclerView sheltersRecyclerView;
    private GridLayout emergencyGrid;
    private RecyclerView modulesRecyclerView;

    @Override
    protected int getLayoutRes() {
        return R.layout.fragment_citizen_dashboard;
    }

    @Override
    protected void initViews(View view) {
        shelterRepository = new ShelterRepository(requireActivity());

        safetyStatusValue = view.findViewById(R.id.safetyStatusValue);
        safetyStatusSubtitle = view.findViewById(R.id.safetyStatusSubtitle);
        safetyActionButton = view.findViewById(R.id.safetyActionButton);
        forecastRecyclerView = view.findViewById(R.id.forecastRecyclerView);
        familyRecyclerView = view.findViewById(R.id.familyRecyclerView);
        sheltersRecyclerView = view.findViewById(R.id.sheltersRecyclerView);
        emergencyGrid = view.findViewById(R.id.emergencyGrid);
        modulesRecyclerView = view.findViewById(R.id.modulesRecyclerView);

        setupForecast();
        setupFamily();
        setupShelters();
        setupEmergencyGrid();
        setupModules();
        setupSafetyStatus();
    }

    private void setupForecast() {
        forecastRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false));
        List<ForecastItem> forecasts = Arrays.asList(
                new ForecastItem("Today", "☀️ Sunny", "32°C / 24°C", "0%", "@color/colorSuccess"),
                new ForecastItem("Tomorrow", "🌧️ Rain", "28°C / 22°C", "70%", "@color/colorWarning"),
                new ForecastItem("Day 3", "⛈️ Storm", "26°C / 20°C", "90%", "@color/colorCritical")
        );
        forecastRecyclerView.setAdapter(new ForecastAdapter(forecasts));
    }

    private void setupFamily() {
        familyRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false));
        List<FamilyItem> family = Arrays.asList(
                new FamilyItem("You", "safe", R.drawable.ic_person),
                new FamilyItem("Rahul", "safe", R.drawable.ic_person),
                new FamilyItem("Anaya", "safe", R.drawable.ic_person)
        );
        familyRecyclerView.setAdapter(new FamilyAdapter(family));
    }

    private void setupShelters() {
        sheltersRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        shelterRepository.getAllShelters().observe(getViewLifecycleOwner(), shelters -> {
            if (shelters != null) {
                sheltersRecyclerView.setAdapter(new ShelterListAdapter(shelters.subList(0, Math.min(3, shelters.size()))));
            }
        });
    }

    private void setupEmergencyGrid() {
        String[][] contacts = {
                {"Control Room", "1070", "☎️"},
                {"Police", "100", "👮"},
                {"Ambulance", "108", "🚑"},
                {"Fire", "101", "🚒"}
        };

        for (int i = 0; i < contacts.length; i++) {
            String[] c = contacts[i];
            View card = LayoutInflater.from(requireContext()).inflate(R.layout.item_emergency_contact, emergencyGrid, false);
            TextView name = card.findViewById(R.id.contactName);
            TextView number = card.findViewById(R.id.contactNumber);
            TextView icon = card.findViewById(R.id.contactIcon);
            name.setText(c[0]);
            number.setText(c[1]);
            icon.setText(c[2]);

            int finalI = i;
            card.setOnClickListener(v -> {
                String phone = contacts[finalI][1];
                android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_DIAL);
                intent.setData(android.net.Uri.parse("tel:" + phone));
                startActivity(intent);
            });

            GridLayout.LayoutParams params = new GridLayout.LayoutParams();
            params.width = 0;
            params.columnSpec = GridLayout.spec(GridLayout.UNDEFINED, 1f);
            params.rowSpec = GridLayout.spec(i / 2);
            card.setLayoutParams(params);
            emergencyGrid.addView(card);
        }
    }

    private void setupModules() {
        modulesRecyclerView.setLayoutManager(new GridLayoutManager(requireContext(), 2));
        List<ModuleItem> modules = Arrays.asList(
                new ModuleItem("SOS Report", R.drawable.ic_sos, "@color/colorCritical"),
                new ModuleItem("Live Alerts", R.drawable.ic_alerts, "@color/colorWarning"),
                new ModuleItem("Nearby Shelters", R.drawable.ic_map, "@color/colorInfo"),
                new ModuleItem("Family Circle", R.drawable.ic_person, "@color/colorSuccess"),
                new ModuleItem("AI Assistant", R.drawable.ic_bot, "@color/accentCitizen"),
                new ModuleItem("Settings", R.drawable.ic_more, "@color/textMuted")
        );
        modulesRecyclerView.setAdapter(new ModuleAdapter(modules, this::onModuleClick));
    }

    private void onModuleClick(ModuleItem item) {
        switch (item.title) {
            case "SOS Report":
                navigateToSos();
                break;
            case "Live Alerts":
                navigateToAlerts();
                break;
            case "Nearby Shelters":
                navigateToShelters();
                break;
            case "Family Circle":
                navigateToFamily();
                break;
            case "AI Assistant":
                navigateToAI();
                break;
            case "Settings":
                navigateToSettings();
                break;
        }
    }

    private void navigateToSos() {
        requireActivity().getSupportFragmentManager().beginTransaction()
                .replace(R.id.nav_host_fragment, new SosFragment())
                .addToBackStack(null)
                .commit();
    }

    private void navigateToAlerts() {
        requireActivity().getSupportFragmentManager().beginTransaction()
                .replace(R.id.nav_host_fragment, new PublicAlertsFragment())
                .addToBackStack(null)
                .commit();
    }

    private void navigateToShelters() {
        requireActivity().getSupportFragmentManager().beginTransaction()
                .replace(R.id.nav_host_fragment, new PublicSheltersFragment())
                .addToBackStack(null)
                .commit();
    }

    private void navigateToFamily() {
        requireActivity().getSupportFragmentManager().beginTransaction()
                .replace(R.id.nav_host_fragment, new FamilyCircleFragment())
                .addToBackStack(null)
                .commit();
    }

    private void navigateToAI() {
        requireActivity().getSupportFragmentManager().beginTransaction()
                .replace(R.id.nav_host_fragment, new MitronChatFragment())
                .addToBackStack(null)
                .commit();
    }

    private void navigateToSettings() {
        requireActivity().getSupportFragmentManager().beginTransaction()
                .replace(R.id.nav_host_fragment, new SettingsFragment())
                .addToBackStack(null)
                .commit();
    }

    private void setupSafetyStatus() {
        safetyStatusValue.setText("SAFE");
        safetyStatusValue.setTextColor(getColor(R.color.colorSuccess));
        safetyStatusSubtitle.setText("Your area is currently safe. Stay prepared.");
        safetyActionButton.setOnClickListener(v -> navigateToAlerts());
    }

    // Simple data classes
    static class ForecastItem {
        String day, condition, temp, rain, colorRes;
        ForecastItem(String day, String condition, String temp, String rain, String colorRes) {
            this.day = day; this.condition = condition; this.temp = temp; this.rain = rain; this.colorRes = colorRes;
        }
    }

    static class FamilyItem {
        String name, status; int iconRes;
        FamilyItem(String name, String status, int iconRes) {
            this.name = name; this.status = status; this.iconRes = iconRes;
        }
    }

    static class ModuleItem {
        String title; int iconRes; String colorRes;
        ModuleItem(String title, int iconRes, String colorRes) {
            this.title = title; this.iconRes = iconRes; this.colorRes = colorRes;
        }
    }

    // Adapters
    static class ForecastAdapter extends RecyclerView.Adapter<ForecastAdapter.VH> {
        List<ForecastItem> items;
        ForecastAdapter(List<ForecastItem> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) {
            View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_forecast, p, false);
            return new VH(view);
        }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            ForecastItem item = items.get(pos);
            h.day.setText(item.day);
            h.condition.setText(item.condition);
            h.temp.setText(item.temp);
            h.rain.setText(item.rain + " rain");
            h.card.setCardBackgroundColor(h.itemView.getContext().getColor(
                    item.colorRes.equals("@color/colorSuccess") ? R.color.colorSuccess :
                            item.colorRes.equals("@color/colorWarning") ? R.color.colorWarning : R.color.colorCritical
            ));
        }
        @Override public int getItemCount() { return items.size(); }
        static class VH extends RecyclerView.ViewHolder {
            TextView day, condition, temp, rain; MaterialCardView card;
            VH(View v) { super(v); day = v.findViewById(R.id.forecastDay); condition = v.findViewById(R.id.forecastCondition); temp = v.findViewById(R.id.forecastTemp); rain = v.findViewById(R.id.forecastRain); card = v.findViewById(R.id.forecastCard); }
        }
    }

    static class FamilyAdapter extends RecyclerView.Adapter<FamilyAdapter.VH> {
        List<FamilyItem> items;
        FamilyAdapter(List<FamilyItem> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) {
            View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_family_member, p, false);
            return new VH(view);
        }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            FamilyItem item = items.get(pos);
            h.name.setText(item.name);
            h.status.setText(item.status);
            h.avatar.setImageResource(item.iconRes);
        }
        @Override public int getItemCount() { return items.size(); }
        static class VH extends RecyclerView.ViewHolder {
            ImageView avatar; TextView name, status;
            VH(View v) { super(v); avatar = v.findViewById(R.id.familyAvatar); name = v.findViewById(R.id.familyName); status = v.findViewById(R.id.familyStatus); }
        }
    }

    static class ShelterListAdapter extends RecyclerView.Adapter<ShelterListAdapter.VH> {
        List<ShelterEntity> items;
        ShelterListAdapter(List<ShelterEntity> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) {
            View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_shelter_list, p, false);
            return new VH(view);
        }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            ShelterEntity s = items.get(pos);
            h.name.setText(s.name);
            h.district.setText(s.district);
            h.capacity.setText(s.currentOccupancy + "/" + s.capacity + " occupied");
            int pct = (int) ((s.currentOccupancy * 100f) / Math.max(1, s.capacity));
            h.progress.setProgress(pct);
            h.status.setText(s.status.toUpperCase());
            h.status.setTextColor(h.itemView.getContext().getColor(
                    s.status.equals("full") ? R.color.colorCritical :
                            s.status.equals("open") ? R.color.colorSuccess : R.color.textMuted
            ));
        }
        @Override public int getItemCount() { return items.size(); }
        static class VH extends RecyclerView.ViewHolder {
            TextView name, district, capacity, status; androidx.appcompat.widget.AppCompatSeekBar progress;
            VH(View v) { super(v); name = v.findViewById(R.id.shelterName); district = v.findViewById(R.id.shelterDistrict); capacity = v.findViewById(R.id.shelterCapacity); progress = v.findViewById(R.id.shelterProgress); status = v.findViewById(R.id.shelterStatus); }
        }
    }

    static class ModuleAdapter extends RecyclerView.Adapter<ModuleAdapter.VH> {
        List<ModuleItem> items; java.util.function.Consumer<ModuleItem> onClick;
        ModuleAdapter(List<ModuleItem> items, java.util.function.Consumer<ModuleItem> onClick) {
            this.items = items; this.onClick = onClick;
        }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) {
            View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_module_card, p, false);
            return new VH(view);
        }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            ModuleItem item = items.get(pos);
            h.title.setText(item.title);
            h.icon.setImageResource(item.iconRes);
            h.card.setCardBackgroundColor(h.itemView.getContext().getColor(R.color.bgSecondary));
            h.card.setOnClickListener(v -> onClick.accept(item));
        }
        @Override public int getItemCount() { return items.size(); }
        static class VH extends RecyclerView.ViewHolder {
            TextView title; ImageView icon; MaterialCardView card;
            VH(View v) { super(v); title = v.findViewById(R.id.moduleTitle); icon = v.findViewById(R.id.moduleIcon); card = v.findViewById(R.id.moduleCard); }
        }
    }
}