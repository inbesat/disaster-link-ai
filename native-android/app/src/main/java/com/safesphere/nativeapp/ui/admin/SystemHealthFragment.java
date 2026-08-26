package com.safesphere.nativeapp.ui.admin;

import android.graphics.Color;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.LineData;
import com.github.mikephil.charting.data.LineDataSet;
import com.github.mikephil.charting.formatter.ValueFormatter;
import com.safesphere.nativeapp.R;

import java.util.ArrayList;
import java.util.List;

public class SystemHealthFragment extends Fragment {

    private TextView healthSummary;
    private RecyclerView servicesRecyclerView;
    private LineChart responseTimeChart;

    @Nullable @Override public View onCreateView(@NonNull LayoutInflater inf, @Nullable ViewGroup c, @Nullable Bundle b) {
        return inf.inflate(R.layout.fragment_system_health, c, false);
    }

    @Override public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        healthSummary = view.findViewById(R.id.healthSummary);
        servicesRecyclerView = view.findViewById(R.id.servicesRecyclerView);
        responseTimeChart = view.findViewById(R.id.responseTimeChart);

        setupServices();
        setupResponseTimeChart();
    }

    private void setupServices() {
        servicesRecyclerView.setLayoutManager(new LinearLayoutManager(requireContext()));
        List<ServiceItem> services = new ArrayList<>();
        services.add(new ServiceItem("Supabase DB Connection", "db.pooler.supabase.com:5432", "green", "24 ms", "Postgres + PostGIS + pgvector OK"));
        services.add(new ServiceItem("OpenWeather API Sync", "api.openweathermap.org/v3", "amber", "412 ms", "Last sync 47m ago · 1 stale station"));
        services.add(new ServiceItem("Groq NLP Endpoint", "api.groq.com/openai/v1", "green", "166 ms", "Tool-calling + classification healthy"));
        services.add(new ServiceItem("XGBoost ML Microservice", "localhost:8000/predict", "red", "timeout", "Model node unreachable on :8000"));

        long healthy = 0;
        for (ServiceItem s : services) { if (s.status.equals("green")) healthy++; }
        healthSummary.setText(healthy + "/" + services.size() + " SERVICES HEALTHY");
        healthSummary.setTextColor(requireContext().getColor(healthy == services.size() ? R.color.colorSuccess : R.color.colorWarning));

        servicesRecyclerView.setAdapter(new ServiceAdapter(services));
    }

    private void setupResponseTimeChart() {
        List<Entry> entries = new ArrayList<>();
        for (int i = 0; i < 24; i++) entries.add(new Entry(i, (float) (Math.random() * 500 + 50)));

        LineDataSet set = new LineDataSet(entries, "p95 Latency (ms)");
        set.setColor(Color.parseColor("#38BDF8"));
        set.setLineWidth(2f);
        set.setDrawCircles(false);
        set.setMode(LineDataSet.Mode.CUBIC_BEZIER);
        set.setDrawFilled(true);
        set.setFillColor(Color.parseColor("#38BDF8"));
        set.setFillAlpha(40);

        responseTimeChart.getDescription().setEnabled(false);
        responseTimeChart.getLegend().setEnabled(false);
        responseTimeChart.getXAxis().setPosition(XAxis.XAxisPosition.BOTTOM);
        responseTimeChart.getXAxis().setValueFormatter(new ValueFormatter() {
            @Override public String getFormattedValue(float value) {
                return String.valueOf((int) value) + "h";
            }
        });
        responseTimeChart.getXAxis().setTextColor(Color.parseColor("#64748B"));
        responseTimeChart.getAxisLeft().setTextColor(Color.parseColor("#64748B"));
        responseTimeChart.getAxisRight().setEnabled(false);
        responseTimeChart.setData(new LineData(set));
        responseTimeChart.invalidate();
    }

    static class ServiceItem { String name, host, status, latency, note; ServiceItem(String n, String h, String s, String l, String no) { name=n; host=h; status=s; latency=l; note=no; } }
    static class ServiceAdapter extends RecyclerView.Adapter<ServiceAdapter.VH> {
        List<ServiceItem> items; ServiceAdapter(List<ServiceItem> items) { this.items = items; }
        @NonNull @Override public VH onCreateViewHolder(@NonNull ViewGroup p, int v) { View view = LayoutInflater.from(p.getContext()).inflate(R.layout.item_service_card, p, false); return new VH(view); }
        @Override public void onBindViewHolder(@NonNull VH h, int pos) {
            ServiceItem s = items.get(pos);
            h.name.setText(s.name);
            h.host.setText(s.host);
            int colorRes = s.status.equals("green") ? R.color.colorSuccess : s.status.equals("amber") ? R.color.colorWarning : R.color.colorCritical;
            h.statusDot.setBackgroundColor(h.itemView.getContext().getColor(colorRes));
            h.statusText.setText(s.status.toUpperCase());
            h.statusText.setTextColor(h.itemView.getContext().getColor(colorRes));
            h.latency.setText(s.latency);
            h.note.setText(s.note);
        }
        @Override public int getItemCount() { return items.size(); }
        static class VH extends RecyclerView.ViewHolder { TextView name, host, statusText, latency, note; View statusDot; VH(View v) { super(v); name = v.findViewById(R.id.svcName); host = v.findViewById(R.id.svcHost); statusDot = v.findViewById(R.id.svcStatusDot); statusText = v.findViewById(R.id.svcStatusText); latency = v.findViewById(R.id.svcLatency); note = v.findViewById(R.id.svcNote); } }
    }
}