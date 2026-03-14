//When document is ready
function update_counters_chart(total_set, total_artist, total_genre) {
  $("#total_set_card").text(total_set);
  $("#total_artist_card").text(total_artist);
  $("#total_genre_card").text(total_genre);
}

const main_colors = ["#f94144", "#f3722c", "#f8961e", "#f9844a", "#f9c74f", "#90be6d", "#43aa8b", "#4d908e", "#577590", "#277da1"];

function update_rated_pie_chart(rated, unrated) {
  var chartDom = document.getElementById('rated_pie_chart');
  var myChart = echarts.init(chartDom);
  var option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        name: 'Rating Status',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%',
          color: '#303030',
          fontSize: 14,
          fontWeight: 'bold'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: rated, name: 'Rated', itemStyle: { color: '#43aa8b' } },
          { value: unrated, name: 'Unrated', itemStyle: { color: '#f9c74f' } }
        ]
      }
    ]
  };
  myChart.setOption(option);
}

function update_top10_artists(top10) {
  var series_data = [];
  var x_axis_data = [];
  // Reverse to show the highest at the top in horizontal view
  const reversedTop10 = [...top10].reverse();
  for (var i = 0; i < reversedTop10.length; i++) {
    series_data.push(reversedTop10[i]['sets']);
    x_axis_data.push(reversedTop10[i]['name']);
  }

  var chartDom = document.getElementById('top10_artists_chart');
  var myChart = echarts.init(chartDom);
  var option = {
    title: {
      text: 'Top 10 Artists',
      left: 'center',
      top: 10,
      textStyle: { color: '#303030', fontSize: 22, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '5%',
      right: '10%',
      bottom: '5%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      splitLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: x_axis_data,
      axisLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#303030',
        formatter: function (value, index) {
            return (reversedTop10.length - index) + ". " + value;
        }
      }
    },
    series: [
      {
        name: 'Sets',
        type: 'bar',
        data: series_data,
        label: {
          show: true,
          position: 'right',
          color: '#303030',
          fontWeight: 'bold'
        },
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: function (params) {
            return main_colors[9 - params.dataIndex % 10];
          }
        }
      }
    ]
  };
  myChart.setOption(option);
}

function update_top10_genres(top10) {
  var series_data = [];
  var x_axis_data = [];
  const reversedTop10 = [...top10].reverse();
  for (var i = 0; i < reversedTop10.length; i++) {
    series_data.push(reversedTop10[i]['sets']);
    x_axis_data.push(reversedTop10[i]['name']);
  }

  var chartDom = document.getElementById('top10_genres_chart');
  var myChart = echarts.init(chartDom);
  var option = {
    title: {
      text: 'Top 10 Genres',
      left: 'center',
      top: 10,
      textStyle: { color: '#303030', fontSize: 22, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '5%',
      right: '10%',
      bottom: '5%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      splitLine: { show: false }
    },
    yAxis: {
      type: 'category',
      data: x_axis_data,
      axisLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#303030',
        formatter: function (value, index) {
            return (reversedTop10.length - index) + ". " + value;
        }
      }
    },
    series: [
      {
        name: 'Sets',
        type: 'bar',
        data: series_data,
        label: {
          show: true,
          position: 'right',
          color: '#303030',
          fontWeight: 'bold'
        },
        itemStyle: {
          borderRadius: [0, 8, 8, 0],
          color: function (params) {
            return main_colors[9 - params.dataIndex % 10];
          }
        }
      }
    ]
  };
  myChart.setOption(option);
}

function update_rating_repartition(rating_repartition) {
  var series_data = [];
  var x_axis_data = [];
  var rating_order = ['0', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5'];
  for (var i = 0; i < rating_order.length; i++) {
    x_axis_data.push(rating_order[i]);
    series_data.push(rating_repartition[rating_order[i]] || 0);
  }

  var chartDom = document.getElementById('rating_repartition_chart');
  var myChart = echarts.init(chartDom);
  var option = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: x_axis_data,
      boundaryGap: false
    },
    yAxis: { type: 'value', splitLine: { show: false } },
    series: [
      {
        data: series_data,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 4, color: '#277da1' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#277da1' },
            { offset: 1, color: '#f94144' }
          ])
        },
        itemStyle: { color: '#277da1' }
      }
    ]
  };
  myChart.setOption(option);
}

function update_platforms_repartition(platforms_repartition) {
  const soundcloud_color = '#ff5500';
  const youtube_color = '#ff0033';
  const other_color = '#90be6d';

  var platforms = Object.keys(platforms_repartition);
  var values = Object.values(platforms_repartition);
  var total = values.reduce((a, b) => a + b, 0);

  var series = platforms.map((platform, i) => {
    let color = other_color;
    if (platform === 'soundcloud') color = soundcloud_color;
    else if (platform === 'youtube') color = youtube_color;

    return {
      name: platform,
      type: 'bar',
      stack: 'total',
      emphasis: { focus: 'series' },
      data: [values[i]],
      itemStyle: { color: color, borderRadius: 5 },
      label: {
        show: true,
        formatter: (p) => {
            const val = p.value;
            const percent = ((val / total) * 100).toFixed(0);
            return percent > 5 ? `${percent}%` : '';
        },
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff'
      }
    };
  });

  var chartDom = document.getElementById('platforms_repartition_chart');
  var myChart = echarts.init(chartDom);
  var option = {
    title: {
      text: 'Platforms Repartition',
      left: 'center',
      top: 10,
      textStyle: { color: '#303030', fontSize: 20, fontWeight: 'bold' }
    },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0, textStyle: { fontSize: 14, fontWeight: 'bold' } },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '25%', containLabel: true },
    xAxis: { type: 'value', max: total, show: false },
    yAxis: { type: 'category', data: ['Platforms'], show: false },
    series: series
  };
  myChart.setOption(option);
}

function update_top5_most_played(top5) {
  var container = $("#top5_most_played_chart");
  container.empty();
  container.addClass("d-flex flex-column align-items-center");

  container.append("<h3 class='text-center mb-4 text-dark fw-bold'>Top 5 Most Played</h3>");

  if (top5.length === 0) return;

  var podium = $('<div class="d-flex justify-content-center align-items-end mb-5 flex-wrap" style="gap: 15px;"></div>');

  var displayOrder = [];
  if (top5.length >= 2) displayOrder.push(1); // Rank 2
  if (top5.length >= 1) displayOrder.push(0); // Rank 1
  if (top5.length >= 3) displayOrder.push(2); // Rank 3

  displayOrder.forEach(function (idx) {
    var item = top5[idx];
    var isFirst = idx === 0;
    var height = isFirst ? "180px" : (idx === 1 ? "140px" : "120px");
    var color = isFirst ? "#FFD700" : (idx === 1 ? "#C0C0C0" : "#CD7F32");
    var thumb = item.thumbnail_url && item.thumbnail_url !== "NULL" ? item.thumbnail_url : 'https://placehold.co/150?text=No+Image';

    var card = `
            <div class="d-flex flex-column align-items-center" style="width: 140px;">
                <div class="mb-2 fw-bold" style="color: ${color}; font-size: 1.5rem; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">#${item.rank}</div>
                <div class="position-relative mb-2">
                    <img src="${thumb}" class="rounded-circle shadow" style="width: ${isFirst ? '120px' : '90px'}; height: ${isFirst ? '120px' : '90px'}; object-fit: cover; border: 4px solid ${color};" onerror="this.src='https://placehold.co/100?text=No+Image'">
                </div>
                <div class="bg-white p-2 rounded shadow-sm text-center w-100 position-relative" style="z-index: 2;">
                     <div class="fw-bold text-truncate" title="${item.name}">${item.name}</div>
                     <div class="text-muted small">${item.click_count} plays</div>
                </div>
                <div style="background: linear-gradient(to bottom, ${color}, white); height: ${height}; width: 80%; border-radius: 8px 8px 0 0; margin-top: -5px; z-index: 1;"></div>
            </div>
        `;
    podium.append(card);
  });

  container.append(podium);

  if (top5.length > 3) {
    var list = $('<div class="list-group w-100" style="max-width: 600px;"></div>');
    for (var i = 3; i < top5.length; i++) {
      var item = top5[i];
      var thumb = item.thumbnail_url && item.thumbnail_url !== "NULL" ? item.thumbnail_url : 'https://placehold.co/50?text=No+Img';
      var row = `
                <div class="list-group-item d-flex justify-content-between align-items-center shadow-sm mb-2 border-0 rounded">
                    <div class="d-flex align-items-center overflow-hidden">
                        <span class="fw-bold me-3 text-secondary" style="font-size: 1.2rem; min-width: 30px;">#${item.rank}</span>
                        <img src="${thumb}" class="rounded me-3" style="width: 50px; height: 50px; object-fit: cover;" onerror="this.src='https://placehold.co/50?text=No+Img'">
                        <span class="text-truncate fw-bold text-dark" title="${item.name}">${item.name}</span>
                    </div>
                    <span class="badge bg-dark rounded-pill p-2">${item.click_count} plays</span>
                </div>
            `;
      list.append(row);
    }
    container.append(list);
  }
}

function update_timechart(element_id, data_array, title, label_name) {
  var series_data = [];
  var x_axis_data = [];
  for (var i = 0; i < data_array.length; i++) {
    series_data.push(data_array[i]['count']);
    x_axis_data.push(data_array[i]['month']);
  }

  var chartDom = document.getElementById(element_id);
  var myChart = echarts.init(chartDom);
  var option = {
    title: {
      text: title,
      left: 'center',
      top: 10,
      textStyle: { color: '#303030', fontSize: 18, fontWeight: 'bold' }
    },
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '20%', containLabel: true },
    xAxis: {
      type: 'category',
      data: x_axis_data,
      axisLabel: { color: '#303030', fontSize: 10, fontWeight: 'bold', rotate: 45 }
    },
    yAxis: { type: 'value', splitLine: { show: false } },
    series: [
      {
        name: label_name,
        data: series_data,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 4, color: '#277da1' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#277da1' },
            { offset: 1, color: '#f94144' }
          ]),
          opacity: 0.8
        },
        itemStyle: { color: '#277da1' }
      }
    ]
  };
  myChart.setOption(option);
}

function update_timechart_inserted(time_inserted) {
    update_timechart('time_inserted_chart', time_inserted, 'Sets Inserted Over Time', 'Sets Inserted');
}

function update_timechart_released(time_released) {
    update_timechart('time_released_chart', time_released, 'Sets Released Over Time', 'Sets Released');
}

function update_repartition_bar_chart(element_id, data, title, color_theme) {
  var x_axis = Object.keys(data);
  var y_axis = Object.values(data);

  var chartDom = document.getElementById(element_id);
  var myChart = echarts.init(chartDom);
  var option = {
    title: {
      text: title,
      left: 'center',
      textStyle: { fontSize: 18, color: '#303030', fontWeight: 'bold' }
    },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: x_axis,
      axisLabel: { color: '#303030', fontSize: 12, fontWeight: 'bold' }
    },
    yAxis: { type: 'value', splitLine: { show: false } },
    series: [
      {
        name: 'Count',
        type: 'bar',
        data: y_axis,
        label: { show: true, position: 'top', color: '#303030', fontWeight: 'bold' },
        itemStyle: {
          borderRadius: [7, 7, 0, 0],
          color: function (params) {
            const colors = color_theme || main_colors;
            return colors[params.dataIndex % colors.length];
          }
        }
      }
    ]
  };
  myChart.setOption(option);
}

function update_crowd_level_repartition(data) {
  update_repartition_bar_chart('crowd_level_repartition_chart', data, 'Crowd Level', ["#f94144", "#f9844a", "#f9c74f", "#90be6d", "#43aa8b"]);
}

function update_audio_quality_repartition(data) {
  update_repartition_bar_chart('audio_quality_repartition_chart', data, 'Audio Quality', ["#f94144", "#f9844a", "#f9c74f", "#90be6d", "#43aa8b"]);
}

function update_artist_talking_repartition(data) {
  update_repartition_bar_chart('artist_talking_repartition_chart', data, 'Artist Talking', ["#43aa8b", "#f94144", "#f9c74f"]);
}

function updateStats(stats) {
  update_counters_chart(stats['sets']['total'], stats['artists']['total'], stats['genres']['total']);
  update_rated_pie_chart(stats['sets']['rated'], stats['sets']['unrated']);
  update_top10_artists(stats['artists']['top_10']);
  update_top10_genres(stats['genres']['top_10']);
  update_rating_repartition(stats['sets']['rating_repartition']);
  update_timechart_inserted(stats['sets']['time_inserted']);
  update_platforms_repartition(stats['sets']['platform_repartition']);
  update_top5_most_played(stats['sets']['top_5_most_played']);
  update_timechart_released(stats['sets']['time_released']);
  update_crowd_level_repartition(stats['sets']['crowd_level_repartition']);
  update_audio_quality_repartition(stats['sets']['audio_quality_repartition']);
  update_artist_talking_repartition(stats['sets']['artist_talking_repartition']);
}

$(document).ready(function () {
  var json_to_send = {
    session_token: localStorage.getItem("token"),
  };

  $.ajax({
    url: '/api/get_stats',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(json_to_send),
    success: function (response) {
      console.log(response);
      updateStats(response);
    },
    error: function () {
      window.location.href = "../";
    }
  });

  // Handle window resize for ECharts
  window.addEventListener('resize', function() {
    const charts = [
        'rated_pie_chart', 'top10_artists_chart', 'top10_genres_chart', 
        'rating_repartition_chart', 'platforms_repartition_chart',
        'time_inserted_chart', 'time_released_chart',
        'crowd_level_repartition_chart', 'audio_quality_repartition_chart',
        'artist_talking_repartition_chart'
    ];
    charts.forEach(id => {
        const dom = document.getElementById(id);
        if (dom) {
            const chart = echarts.getInstanceByDom(dom);
            if (chart) chart.resize();
        }
    });
  });
});