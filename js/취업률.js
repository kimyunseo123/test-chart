const svg = d3.select("svg");
const margin = { top: 20, right: 30, bottom: 40, left: 70 };
const width = +svg.attr("width") - margin.left - margin.right;
const height = +svg.attr("height") - margin.top - margin.bottom;
const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip 생성
const tooltip = d3.select("body")
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

// X축 및 Y축 그룹 추가
const xAxisGroup = g.append("g").attr("transform", `translate(0, ${height})`);
const yAxisGroup = g.append("g");

// Y축 제목 추가
svg.append("text")
    .attr("class", "y-axis-label")
    .attr("x", margin.left / 2) // X 좌표 설정
    .attr("y", margin.top + 40) // Y 좌표 설정
    .attr("text-anchor", "middle")
    .attr("fill", "#555")
    .text("(%)")
    .style("font-size", "11px");

// 엑셀 파일 로드
fetch("data/취업률.xlsx")
    .then(response => response.arrayBuffer())
    .then(data => {
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(sheetData); // 데이터 확인

        // 데이터 추출
        const regions = sheetData.map(row => row["지역"]);
        const employmentRates = sheetData.map(row => +row["취업률(%)"]);
        const universities = sheetData.map(row => row["학교명"]);

        // X축 및 Y축 스케일
        const xScale = d3.scalePoint()
            .domain(regions)
            .range([0, width])
            .padding(0.5);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(employmentRates)])
            .range([height, 0]);

        // 색상 스케일
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain([...new Set(regions)]);

        // X축 및 Y축 그리기
        xAxisGroup.call(d3.axisBottom(xScale).tickSize(0).tickPadding(10));
        yAxisGroup.call(d3.axisLeft(yScale).ticks(10).tickSize(-width));

        // 데이터 점 그리기
        g.selectAll(".point")
            .data(sheetData)
            .enter()
            .append("circle")
            .attr("class", "point")
            .attr("cx", d => xScale(d["지역"]))
            .attr("cy", d => yScale(d["취업률(%)"]))
            .attr("r", 5) // 점 크기
            .attr("fill", d => colorScale(d["지역"]))
            .attr("fill-opacity", 0.5) // 투명도
            .on("mouseover", (event, d) => {
                tooltip.style("opacity", 1)
                    .html(`<strong>대학명:</strong> ${d["학교명"]}<br><strong>취업률:</strong> ${d["취업률(%)"]}%`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0);
            });
    })
    .catch(error => {
        console.error("Error loading Excel file:", error);
    });