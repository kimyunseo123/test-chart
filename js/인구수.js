const popSvg = d3.select("#population-chart");
const popMargin = { top: 20, right: 30, bottom: 60, left: 90 };
const popWidth = +popSvg.attr("width") - popMargin.left - popMargin.right;
const popHeight = +popSvg.attr("height") - popMargin.top - popMargin.bottom;
const popG = popSvg.append("g").attr("transform", `translate(${popMargin.left},${popMargin.top})`);

// Tooltip 생성
const popTooltip = d3.select("body")
    .append("div")
    .attr("class", "pop-tooltip")
    .style("position", "absolute")
    .style("padding", "10px")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

// 엑셀 파일 로드
fetch("data/인구수.xlsx")
    .then(response => response.arrayBuffer())
    .then(data => {
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        console.log(sheetData); 

        // 데이터 추출
        const regions = sheetData.map(row => row["행정기관"].replace("전라남도 ", "")); 
        const populations = sheetData.map(row => +row["전체"].toString().replace(/,/g, ""));

        console.log("Regions (modified):", regions); 
        console.log("Populations:", populations);

        const popXScale = d3.scaleBand()
            .domain(regions)
            .range([0, popWidth])
            .padding(0.2);

        const popYScale = d3.scaleLinear()
            .domain([0, d3.max(populations)])
            .range([popHeight, 0]);

        // X축
        popG.append("g")
            .attr("transform", `translate(0, ${popHeight})`)
            .call(d3.axisBottom(popXScale))
            .selectAll("text")
            .attr("transform", "rotate(-40)")
            .attr("text-anchor", "end");

        // Y축
        popG.append("g")
        .call(d3.axisLeft(popYScale).ticks(10).tickFormat(d => d.toLocaleString()));

        // Y축 제목 추가
        popG.append("text")
        .attr("class", "y-axis-label")
        .attr("x", -popMargin.left + 13) 
        .attr("y", 30)
        .attr("text-anchor", "start") 
        .attr("fill", "#555")
        .text("(명)")
        .style("font-size", "12px");

        // 막대그래프
        popG.selectAll(".bar")
            .data(sheetData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => popXScale(d["행정기관"].replace("전라남도 ", ""))) // "전라남도 " 제거 적용
            .attr("y", d => popYScale(+d["전체"].toString().replace(/,/g, "")))
            .attr("width", popXScale.bandwidth())
            .attr("height", d => popHeight - popYScale(+d["전체"].toString().replace(/,/g, "")))
            .attr("fill", "#4BC0C0")
            .on("mouseover", (event, d) => {
                popTooltip.style("opacity", 1)
                    .html(`<strong>${d["행정기관"].replace("전라남도 ", "")}</strong><br>${(+d["전체"].toString().replace(/,/g, "")).toLocaleString()}명`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", () => {
                popTooltip.style("opacity", 0);
            });
    })
    .catch(error => {
        console.error("Error loading Excel file:", error);
    });