
    const stations = [
      "PRETORIA", "PRETORIA-B", "BARRACKS", "PRETORIA WES", "MITCHELLSTRAAT", "REBECCA",
      "ELECTRO", "COR DELFOS", "KALAFONG", "ATTERIDGEVILLE", "SAULSVILLE"
    ];
    const trainNos = ["0003","0005","0007","0009","0011","0013","0015","0017","0019","0021","0023","0025","0027","0029"];

    const scheduleBody = document.getElementById("scheduleBody");
    const trainHeader = document.getElementById("trainHeader");

    function loadSchedule() {
      // Load or initialize header
      const headerData = JSON.parse(localStorage.getItem("trainHeaders") || "null") || trainNos;
      
      // Create header cells with editable train numbers
      trainHeader.innerHTML = '<th class="station-cell">Station \ Train No.</th>' + 
        headerData.map(num => `
          <th>
            <input type="text" value="${num}" class="train-number-input">
            <span class="edit-icon">✏️</span>
          </th>
        `).join('');
      
      // Add event listeners to header inputs
      document.querySelectorAll('.train-number-input').forEach(input => {
        input.addEventListener('change', updateTrainNumbers);
      });
      
      // Load schedule data
      const data = JSON.parse(localStorage.getItem("trainSchedule") || "[]");
      stations.forEach((station, i) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td class="station-cell"><strong>${station}</strong></td>` +
          headerData.map((_, j) => `<td><input type="text" value="${(data[i] && data[i][j]) || ''}"></td>`).join('');
        scheduleBody.appendChild(row);
      });
    }

    function updateTrainNumbers() {
      const inputs = document.querySelectorAll('.train-number-input');
      const newTrainNos = Array.from(inputs).map(input => input.value.trim());
      localStorage.setItem("trainHeaders", JSON.stringify(newTrainNos));
    }

    function saveSchedule() {
      // Save train numbers
      updateTrainNumbers();
      
      // Save schedule data
      const data = [];
      const rows = scheduleBody.querySelectorAll("tr");
      rows.forEach(row => {
        const inputs = row.querySelectorAll("input:not(.train-number-input)");
        const rowData = Array.from(inputs).map(input => input.value.trim());
        data.push(rowData);
      });
      localStorage.setItem("trainSchedule", JSON.stringify(data));
      alert("Schedule saved successfully!");
    }

    loadSchedule();
