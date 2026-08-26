package com.safesphere.nativeapp.ui.citizen;

import android.Manifest;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.AutoCompleteTextView;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.material.appbar.MaterialToolbar;
import com.safesphere.nativeapp.R;
import com.safesphere.nativeapp.ai.TriageClassifier;
import com.safesphere.nativeapp.data.entity.ReportEntity;
import com.safesphere.nativeapp.data.repository.ReportRepository;
import com.safesphere.nativeapp.ui.base.BaseFragment;
import com.safesphere.nativeapp.util.LocationHelper;

public class ReportFragment extends BaseFragment {

    private TextView locationText;
    private Button useLocationBtn, addPhotoBtn, submitBtn;

    private double reportLat = Double.NaN;
    private double reportLng = Double.NaN;

    @Override protected int getLayoutRes() { return R.layout.fragment_report; }

    @Override protected void initViews(View view) {
        MaterialToolbar toolbar = view.findViewById(R.id.report_toolbar);
        toolbar.setNavigationOnClickListener(v -> requireActivity().onBackPressed());

        String[] types = {"Flood", "Fire", "Medical Emergency", "Building Collapse", "Road Block", "Gas Leak", "Other"};
        AutoCompleteTextView spinner = view.findViewById(R.id.incidentTypeSpinner);
        spinner.setAdapter(new ArrayAdapter<>(requireContext(), android.R.layout.simple_dropdown_item_1line, types));

        locationText = view.findViewById(R.id.locationText);
        useLocationBtn = view.findViewById(R.id.useLocationBtn);
        addPhotoBtn = view.findViewById(R.id.addPhotoBtn);
        submitBtn = view.findViewById(R.id.submitIncidentBtn);

        useLocationBtn.setOnClickListener(v ->
                withPermission(Manifest.permission.ACCESS_FINE_LOCATION, this::acquireLocation));

        submitBtn.setOnClickListener(v -> submitReport());
    }

    private void acquireLocation() {
        locationText.setText("Locating…");
        LocationHelper.getCurrentLocation(this, new LocationHelper.Callback() {
            @Override
            public void onLocation(double lat, double lng, float accuracyMeters) {
                if (!isAdded()) return;
                reportLat = lat;
                reportLng = lng;
                String suffix = accuracyMeters > 0
                        ? String.format(java.util.Locale.US, " (±%.0f m)", accuracyMeters) : "";
                locationText.setText(LocationHelper.formatCoord(lat, lng) + suffix);
            }

            @Override
            public void onUnavailable(@androidx.annotation.NonNull String reason) {
                if (!isAdded()) return;
                reportLat = Double.NaN;
                reportLng = Double.NaN;
                locationText.setText("Location unavailable — tap to retry");
                Toast.makeText(requireContext(), reason.equals("permission_denied")
                        ? "Location permission needed" : "Could not get GPS fix", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void submitReport() {
        AutoCompleteTextView spinner = requireView().findViewById(R.id.incidentTypeSpinner);
        com.google.android.material.textfield.TextInputEditText description =
                requireView().findViewById(R.id.incidentDescription);

        String type = spinner.getText() != null
                ? spinner.getText().toString().toLowerCase(java.util.Locale.US).replace(' ', '_')
                : "other";
        String text = description.getText() != null ? description.getText().toString() : "";

        // Score the report with TFLite triage classifier
        TriageClassifier.Result triage = TriageClassifier.getInstance().score(text, type);

        ReportEntity report = new ReportEntity();
        report.id = "rpt-" + System.currentTimeMillis();
        report.reportType = type;
        report.source = "app";
        report.rawText = text;
        report.verificationStatus = "unverified";
        report.severity = triage.severity;  // 0-100 from TFLite classifier
        report.createdAt = new java.text.SimpleDateFormat(
                "yyyy-MM-dd'T'HH:mm:ss'Z'", java.util.Locale.US).format(new java.util.Date());
        report.updatedAt = report.createdAt;

        if (Double.isNaN(reportLat)) {
            report.lat = 25.5941;
            report.lng = 85.1376;
        } else {
            report.lat = reportLat;
            report.lng = reportLng;
        }

        new ReportRepository(requireActivity().getApplication()).insertReport(report);

        Toast.makeText(requireContext(),
                "Report submitted — severity: " + triage.label + " (" + triage.severity + ")",
                Toast.LENGTH_LONG).show();
        requireActivity().onBackPressed();
    }
}