package com.safesphere.nativeapp.ui.admin;

import android.graphics.Color;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.github.mikephil.charting.charts.BarChart;
import com.github.mikephil.charting.charts.LineChart;
import com.github.mikephil.charting.charts.PieChart;
import com.github.mikephil.charting.components.XAxis;
import com.github.mikephil.charting.components.YAxis;
import com.github.mikephil.charting.data.BarData;
import com.github.mikephil.charting.data.BarDataSet;
import com.github.mikephil.charting.data.BarEntry;
import com.github.mikephil.charting.data.Entry;
import com.github.mikephil.charting.data.LineData;
import com.github.mikephil.charting.data.LineDataSet;
import com.github.mikephil.charting.data.PieData;
import com.github.mikephil.charting.data.PieDataSet;
import com.github.mikephil.charting.data.PieEntry;
import com.github.mikephil.charting.formatter.ValueFormatter;
import com.safesphere.nativeapp.R;

import java.util.ArrayList;
import java.util.List;

public class AnalyticsFragment extends Fragment {

    private LineChart respondersChart;
    private PieChart channelChart;
    private BarChart tokenChart;

    @Nullable @Override public View onCreateView(@NonNull LayoutInflater inf, @Nullable ViewGroup c, @Nullable Bundle b) {
        return inf.inflate(R.layout.fragment_analytics, c, false);
    }

    @Override public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        respondersChart = view.findViewById(R.id.activeRespondersChart);
        channelChart = view.findViewById(R.id.alertsByChannelChart);
        tokenChart = view.findViewById(R.id.tokenUsageChart);

        setupRespondersChart();
        setupChannelChart();
        setupTokenChart();
    }

    private void setupRespondersChart() {
        List<Entry> entries = new ArrayList<>();
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"};
        int[] values = {18, 24, 22, 31, 47, 63, 88, 104};
        for (int i = 0; i < values.length; i++) entries.add(new Entry(i, values[i]));

        LineDataSet set = new LineDataSet(entries, "Active Responders");
        set.setColor(Color.parseColor("#38BDF8"));
        set.setLineWidth(3f);
        set.setCircleColor(Color.parseColor("#38BDF8"));
        set.setCircleRadius(4f);
        set.setDrawFilled(true);
        set.setFillColor(Color.parseColor("#38BDF8"));
        set.setFillAlpha(80);
        set.setMode(LineDataSet.Mode.CUBIC_BEZIER);

        respondersChart.getDescription().setEnabled(false);
        respondersChart.getLegend().setEnabled(false);
        respondersChart.getXAxis().setPosition(XAxis.XAxisPosition.BOTTOM);
        respondersChart.getXAxis().setValueFormatter(new ValueFormatter() {
            @Override public String getFormattedValue(float value) {
                int idx = (int) value;
                return idx >= 0 && idx < months.length ? months[idx] : "";
            }
        });
        respondersChart.getXAxis().setTextColor(Color.parseColor("#64748B"));
        respondersChart.getAxisLeft().setTextColor(Color.parseColor("#64748B"));
        respondersChart.getAxisRight().setEnabled(false);
        respondersChart.setData(new LineData(set));
        respondersChart.invalidate();
    }

    private void setupChannelChart() {
        List<PieEntry> entries = new ArrayList<>();
        entries.add(new PieEntry(412, "SMS"));
        entries.add(new PieEntry(690, "Push"));
        entries.add(new PieEntry(305, "WhatsApp"));

        PieDataSet set = new PieDataSet(entries, "");
        set.setColors(Color.parseColor("#F59E0B"), Color.parseColor("#38BDF8"), Color.parseColor("#34D399"));
        set.setValueTextColor(Color.WHITE);
        set.setValueTextSize(12f);

        channelChart.getDescription().setEnabled(false);
        channelChart.getLegend().setTextColor(Color.parseColor("#94A3B8"));
        channelChart.setData(new PieData(set));
        channelChart.invalidate();
    }

    private void setupTokenChart() {
        List<BarEntry> entries = new ArrayList<>();
        String[] days = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
        int[] values = {12400, 9800, 15600, 11200, 20400, 17300, 8900};
        for (int i = 0; i < values.length; i++) entries.add(new BarEntry(i, values[i]));

        BarDataSet set = new BarDataSet(entries, "Tokens Used");
        set.setColor(Color.parseColor("#F59E0B"));

        tokenChart.getDescription().setEnabled(false);
        tokenChart.getLegend().setEnabled(false);
        tokenChart.getXAxis().setPosition(XAxis.XAxisPosition.BOTTOM);
        tokenChart.getXAxis().setValueFormatter(new ValueFormatter() {
            @Override public String getFormattedValue(float value) {
                int idx = (int) value;
                return idx >= 0 && idx < days.length ? days[idx] : "";
            }
        });
        tokenChart.getXAxis().setTextColor(Color.parseColor("#64748B"));
        tokenChart.getAxisLeft().setTextColor(Color.parseColor("#64748B"));
        tokenChart.getAxisRight().setEnabled(false);
        tokenChart.setData(new BarData(set));
        tokenChart.invalidate();
    }
}