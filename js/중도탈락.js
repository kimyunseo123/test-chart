// 첫 번째 파이 차트 설정
const dropout1Margin = { top: 20, right: 80, bottom: 20, left: 60 }; // 오른쪽 여백을 80으로 확장
const dropout1Width = 400 - dropout1Margin.left - dropout1Margin.right;
const dropout1Height = 400 - dropout1Margin.top - dropout1Margin.bottom;
const dropout1Radius = Math.min(dropout1Width, dropout1Height) / 2;

// 두 번째 파이 차트 설정
const dropout2Margin = { top: 20, right: 80, bottom: 20, left: 60 }; // 오른쪽 여백을 80으로 확장
const dropout2Width = 400 - dropout2Margin.left - dropout2Margin.right;
const dropout2Height = 400 - dropout2Margin.top - dropout2Margin.bottom;
const dropout2Radius = Math.min(dropout2Width, dropout2Height) / 2;

// 색상 스케일
const dropoutColorScale = d3.scaleOrdinal()
    .range([
        "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0",
        "#9966FF", "#FF9F40", "#C9CBCF", "#FF5733"
    ]);

// Tooltip 생성
const dropoutTooltip = d3.select("body")
    .append("div")
    .attr("class", "dropout-tooltip")
    .style("position", "absolute")
    .style("padding", "10px")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

// 첫 번째 차트 SVG
const dropoutSvg1 = d3.select("#dropout-pie1")
    .attr("width", dropout1Width + dropout1Margin.left + dropout1Margin.right)
    .attr("height", dropout1Height + dropout1Margin.top + dropout1Margin.bottom);

// 첫 번째 차트 그룹
const dropoutG1 = dropoutSvg1.append("g")
    .attr("transform", `translate(${(dropout1Width + dropout1Margin.left) / 2}, ${(dropout1Height + dropout1Margin.top) / 2})`);

// 두 번째 차트 SVG
const dropoutSvg2 = d3.select("#dropout-pie2")
    .attr("width", dropout2Width + dropout2Margin.left + dropout2Margin.right)
    .attr("height", dropout2Height + dropout2Margin.top + dropout2Margin.bottom);

// 두 번째 차트 그룹
const dropoutG2 = dropoutSvg2.append("g")
    .attr("transform", `translate(${(dropout2Width + dropout2Margin.left) / 2}, ${(dropout2Height + dropout2Margin.top) / 2})`);

// 데이터 로드 및 파이 차트 생성
fetch("data/중도탈락.xlsx")
    .then(response => response.arrayBuffer())
    .then(data => {
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // 첫 번째 차트 데이터
        const totalStudents = +sheetData[0]['재적학생'].replace(/,/g, '');
        const totalDropouts = +sheetData[0]['사유별 중도탈락 학생 계'].replace(/,/g, '');
        const pieData1 = [
            { label: "중도탈락", value: totalDropouts },
            { label: "재적학생", value: totalStudents - totalDropouts }
        ];

        // 두 번째 차트 데이터
        const reasons = [
            '사유별 중도탈락 학생 미등록',
            '사유별 중도탈락 학생 미복학',
            '사유별 중도탈락 학생 자퇴',
            '사유별 중도탈락 학생 학사경고',
            '사유별 중도탈락 학생 학생활동',
            '사유별 중도탈락 학생 유급제적',
            '사유별 중도탈락 학생 수업연한초과',
            '사유별 중도탈락 학생 기타'
        ];
        const pieData2 = reasons.map(reason => ({
            label: reason.replace('사유별 중도탈락 학생 ', ''),
            value: +sheetData[0][reason].replace(/,/g, '') || 0
        }));

        // 파이 함수 및 아크 생성기
        const pie = d3.pie().value(d => d.value);
        const arc = d3.arc().innerRadius(0).outerRadius(dropout1Radius);

        // 첫 번째 차트 그리기
        dropoutG1.selectAll("path")
            .data(pie(pieData1))
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => dropoutColorScale(d.data.label))
            .on("mouseover", (event, d) => {
                dropoutTooltip.style("opacity", 1)
                    .html(`<strong>${d.data.label}</strong><br>값: ${d.data.value}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            }).on("mouseout", () => dropoutTooltip.style("opacity", 0));

        // 두 번째 차트 그리기
        dropoutG2.selectAll("path")
            .data(pie(pieData2))
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => dropoutColorScale(d.data.label))
            .on("mouseover", (event, d) => {
                dropoutTooltip.style("opacity", 1)
                    .html(`<strong>사유: ${d.data.label}</strong><br>(${d.data.value}/600)`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            }).on("mouseout", () => dropoutTooltip.style("opacity", 0));

        // 첫 번째 차트 범례
        const legend1 = dropoutSvg1.append("g")
            .attr("transform", `translate(${dropout1Width + 20}, ${dropout1Margin.top + 50})`);
        pieData1.forEach((d, i) => {
            legend1.append("rect")
                .attr("x", 0)
                .attr("y", i * 20)
                .attr("width", 12)
                .attr("height", 12)
                .attr("fill", dropoutColorScale(d.label));
            legend1.append("text")
                .attr("x", 20)
                .attr("y", i * 20 + 10)
                .text(d.label)
                .style("font-size", "12px");
        });

        // 두 번째 차트 범례
        const legend2 = dropoutSvg2.append("g")
            .attr("transform", `translate(${dropout2Width + 40}, ${dropout2Margin.top + 50})`);
        pieData2.forEach((d, i) => {
            legend2.append("rect")
                .attr("x", 0)
                .attr("y", i * 20)
                .attr("width", 12)
                .attr("height", 12)
                .attr("fill", dropoutColorScale(d.label));
            legend2.append("text")
                .attr("x", 20)
                .attr("y", i * 20 + 10)
                .text(d.label)
                .style("font-size", "12px");
        });
    })
    .catch(error => console.error("Error loading dropout data:", error));
