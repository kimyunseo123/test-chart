// SVG 및 마진 설정
const hsSvg = d3.select("#highschool-chart");
const hsMargin = { top: 20, right: 30, bottom: 50, left: 100 };
const hsWidth = +hsSvg.attr("width") - hsMargin.left - hsMargin.right;
const hsHeight = +hsSvg.attr("height") - hsMargin.top - hsMargin.bottom;
const hsG = hsSvg.append("g").attr("transform", `translate(${hsMargin.left},${hsMargin.top})`);

// Tooltip 생성
const hsTooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "10px")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

// 엑셀 파일 로드
fetch("data/고등학생수.xlsx")
    .then(response => response.arrayBuffer())
    .then(data => {
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        // 첫 행은 설명, 두 번째 행부터 실제 데이터
        const headers = sheetData[0];
        const dataRows = sheetData.slice(1);

        const years = ["2020", "2021", "2022", "2023"];
        const categories = ["전체", "남자", "여자"];

        // 연도별 데이터 변환
        const yearData = {};
        years.forEach(year => {
            const yearIndex = headers.findIndex(header => header === year);
            const maleIndex = yearIndex + 1;
            const femaleIndex = yearIndex + 2;

            yearData[year] = categories.map((cat, i) => ({
                category: cat,
                value: d3.sum(dataRows, row =>
                    +row[yearIndex + i]?.toString().replace(/,/g, "") || 0
                )
            }));
        });

        // X축 및 Y축 스케일
        const xScale = d3.scaleBand().range([0, hsWidth]).padding(0.2);
        const yScale = d3.scaleLinear()
            .domain([250000, 1350000]) // Y축 범위를 고정
            .range([hsHeight, 0]);

        // X축 및 Y축 추가
        const xAxisGroup = hsG.append("g").attr("transform", `translate(0, ${hsHeight})`);
        const yAxisGroup = hsG.append("g");

        // Y축 레이블 추가
        hsSvg.append("text")
        .attr("x", hsMargin.left / 2 - 25) // X 좌표 설정
        .attr("y", hsMargin.top / 2 + 35) // Y 좌표 설정
        .attr("text-anchor", "middle")
        .attr("fill", "#555")
        .style("font-size", "12px")
        .text("(명)");

        // 드롭다운 초기화
        const dropdown = d3.select("#year-select");
        dropdown.selectAll("option")
            .data(years)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => `${d}년`);
        
        // 색상 설정
        const categoryColors = {
            "전체": "rgba(103, 58, 183, 0.5)",  
            "남자": "rgba(255, 87, 34, 0.5)",  
            "여자": "rgba(33, 150, 243, 0.5)" 
        };

        // 차트 업데이트 함수
        const updateChart = year => {
            const data = yearData[year];
            xScale.domain(data.map(d => d.category));

            // X축 및 Y축 그리기
            xAxisGroup.call(d3.axisBottom(xScale));
            yAxisGroup.call(d3.axisLeft(yScale).ticks(10).tickFormat(d => d.toLocaleString()));

            // 막대 업데이트
            const bars = hsG.selectAll(".bar").data(data);

            bars.enter()
                .append("rect")
                .attr("class", "bar")
                .merge(bars)
                .attr("x", d => xScale(d.category))
                .attr("y", d => yScale(d.value))
                .attr("width", xScale.bandwidth())
                .attr("height", d => hsHeight - yScale(d.value))
                .attr("fill", d => categoryColors[d.category])
                .on("mouseover", (event, d) => {
                    hsTooltip.style("opacity", 1)
                        .html(`${d.value.toLocaleString()}명`)
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 20}px`);
                })
                .on("mouseout", () => hsTooltip.style("opacity", 0));

            bars.exit().remove();
        };

        // 초기 차트 렌더링
        updateChart(years[0]);

        // 드롭다운 변경 이벤트
        dropdown.on("change", function () {
            updateChart(this.value);
        });
    })
    .catch(error => {
        console.error("Error loading Excel file:", error);
    });