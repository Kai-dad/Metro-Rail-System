const canvas = document.getElementById("traffic-chart");
const ctx = canvas.getContext("2d");

const myData = {
  "24h": [
    { label: "00", value: 200 }, { label: "04", value: 450 },
    { label: "08", value: 800 }, { label: "12", value: 650 },
    { label: "16", value: 900 }, { label: "20", value: 300 },
	{ label: "24", value: 350 }
  ],
  "7d": [
    { label: "Mon", value: 12000 }, { label: "Tue", value: 13500 },
    { label: "Wed", value: 10800 }, { label: "Thu", value: 13000 },
    { label: "Fri", value: 14200 }, { label: "Sat", value: 9000 },
    { label: "Sun", value: 8500 }
  ],
  "30d": Array.from({ length: 30 }, (_, i) => ({
    label: `${i + 1}`, value: Math.floor(Math.random() * 5000 + 8000)
  }))
};

function selectRange(range) {
  const data = myData[range];
  drawChart(data);
}

function drawChart(data) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padding = 40;
  const chartHeight = canvas.height - padding * 2;
  const chartWidth = canvas.width - padding * 2;
  const barWidth = chartWidth / data.length - 10;

  const maxVal = Math.max(...data.map(d => d.value));
  ctx.font = "12px Arial";

  data.forEach((item, index) => {
    const x = padding + index * (barWidth + 10);
    const barHeight = (item.value / maxVal) * chartHeight;
    const y = canvas.height - padding - barHeight;

    // Draw bar
    ctx.fillStyle = "#0073e6";
    ctx.fillRect(x, y, barWidth, barHeight);

    // Label
    ctx.fillStyle = "#333";
    ctx.fillText(item.label, x, canvas.height - 10);

    // Value label
    ctx.fillText(item.value, x, y - 5);
  });

  // Y-axis
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.strokeStyle = "#aaa";
  ctx.stroke();
}

