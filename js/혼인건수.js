// SVG 및 마진 설정 (혼인건수)
const marriageSvg = d3.select("#marriage-scatter-plot");
const marriageMargin = { top: 60, right: 20, bottom: 40, left: 80 };
const marriageWidth = +marriageSvg.attr("width") - marriageMargin.left - marriageMargin.right;
const marriageHeight = +marriageSvg.attr("height") - marriageMargin.top - marriageMargin.bottom;
const marriageG = marriageSvg.append("g").attr("transform", `translate(${marriageMargin.left},${marriageMargin.top})`);

// SVG 및 마진 설정 (이혼건수)
const divorceSvg = d3.select("#divorce-scatter-plot");
const divorceMargin = { top: 60, right: 20, bottom: 40, left: 80 };
const divorceWidth = +divorceSvg.attr("width") - divorceMargin.left - divorceMargin.right;
const divorceHeight = +divorceSvg.attr("height") - divorceMargin.top - divorceMargin.bottom;
const divorceG = divorceSvg.append("g").attr("transform", `translate(${divorceMargin.left},${divorceMargin.top})`);

// CSV 파일 로드
d3.csv("data/혼인건수.csv").then(data => {
    // 데이터 변환
    const scatterData = data.map(d => ({
        행정구역: d["행정구역"],
        연도: +d["연도"],
        혼인건수: +d["혼인건수"],
        이혼건수: +d["이혼건수"]
    })).filter(d => d.혼인건수 > 0 || d.이혼건수 > 0); // 0 값 제거

    // 색상 스케일
    const colorScale = d3.scaleOrdinal()
        .domain([...new Set(scatterData.map(d => d.행정구역))])
        .range(d3.schemeCategory10);

    // X축 및 Y축 스케일 (혼인건수)
    const marriageXScale = d3.scaleLinear()
        .domain(d3.extent(scatterData, d => d.연도))
        .range([0, marriageWidth]);

    const marriageYScale = d3.scaleLinear()
        .domain([0, d3.max(scatterData, d => d.혼인건수)])
        .range([marriageHeight, 0]);

    // X축 및 Y축 스케일 (이혼건수)
    const divorceXScale = d3.scaleLinear()
        .domain(d3.extent(scatterData, d => d.연도))
        .range([0, divorceWidth]);

    const divorceYScale = d3.scaleLinear()
        .domain([0, d3.max(scatterData, d => d.이혼건수)])
        .range([divorceHeight, 0]);

    // 혼인건수 X축 및 Y축 추가
    marriageG.append("g")
        .attr("transform", `translate(0, ${marriageHeight})`)
        .call(d3.axisBottom(marriageXScale).tickFormat(d3.format("d")));

    marriageG.append("g")
        .call(d3.axisLeft(marriageYScale));

    // 이혼건수 X축 및 Y축 추가
    divorceG.append("g")
        .attr("transform", `translate(0, ${divorceHeight})`)
        .call(d3.axisBottom(divorceXScale).tickFormat(d3.format("d")));

    divorceG.append("g")
        .call(d3.axisLeft(divorceYScale));

    // 혼인건수 제목 추가
    marriageSvg.append("text")
    .attr("x", marriageWidth / 2 + marriageMargin.left) 
    .attr("y", marriageMargin.top / 2) 
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("[ 혼인건수 ]");

    // 이혼건수 제목 추가
    divorceSvg.append("text")
    .attr("x", divorceWidth / 2 + divorceMargin.left) 
    .attr("y", divorceMargin.top / 2) 
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("[ 이혼건수 ]");

    // 혼인건수 Y축 레이블 추가
    marriageSvg.append("text")
    .attr("x", marriageMargin.left / 2 +5) 
    .attr("y", marriageMargin.top / 2 + marriageHeight / 2 - 460) 
    .attr("transform", `translate(-30, ${marriageHeight / 2})`) 
    .attr("text-anchor", "start")
    .style("font-size", "9px")
    .text("(건)");

    // 이혼건수 Y축 레이블 추가
    divorceSvg.append("text")
    .attr("x", divorceMargin.left / 2 +5)
    .attr("y", divorceMargin.top / 2 + divorceHeight / 2 - 460) 
    .attr("transform", `translate(-30, ${divorceHeight / 2})`) 
    .attr("text-anchor", "start")
    .style("font-size", "9px")
    .text("(건)");

    // 혼인건수 데이터 점 추가
    marriageG.selectAll(".dot")
        .data(scatterData)
        .enter()
        .append("circle")
        .attr("cx", d => marriageXScale(d.연도))
        .attr("cy", d => marriageYScale(d.혼인건수))
        .attr("r", 5)
        .attr("fill", d => colorScale(d.행정구역))
        .attr("fill-opacity", 0.6)
        .on("mouseover", (event, d) => {
            scatterTooltip.style("opacity", 1)
                .html(`${d.행정구역}, ${d.연도}년<br><strong>혼인건수:</strong> ${d.혼인건수.toLocaleString()}건`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        }).on("mouseout", () => scatterTooltip.style("opacity", 0));

    // 이혼건수 데이터 점 추가
    divorceG.selectAll(".dot")
        .data(scatterData)
        .enter()
        .append("circle")
        .attr("cx", d => divorceXScale(d.연도))
        .attr("cy", d => divorceYScale(d.이혼건수))
        .attr("r", 5)
        .attr("fill", d => colorScale(d.행정구역))
        .attr("fill-opacity", 0.6)
        .on("mouseover", (event, d) => {
            scatterTooltip.style("opacity", 1)
                .html(`${d.행정구역}, ${d.연도}년<br><strong>이혼건수:</strong> ${d.이혼건수.toLocaleString()}건`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        }).on("mouseout", () => scatterTooltip.style("opacity", 0));
    
    // 혼인건수 선 추가
    const marriageLine = d3.line()
        .x(d => marriageXScale(d.연도))
        .y(d => marriageYScale(d.혼인건수));
    const marriageDataGrouped = d3.group(scatterData, d => d.행정구역);
    marriageG.selectAll(".line")
        .data(marriageDataGrouped)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", ([, values]) => marriageLine(values))
        .attr("fill", "none")
        .attr("stroke", ([region]) => colorScale(region))
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.7);

    // 이혼건수 선 추가
    const divorceLine = d3.line()
        .x(d => divorceXScale(d.연도))
        .y(d => divorceYScale(d.이혼건수));
    const divorceDataGrouped = d3.group(scatterData, d => d.행정구역);
    divorceG.selectAll(".line")
        .data(divorceDataGrouped)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", ([, values]) => divorceLine(values))
        .attr("fill", "none")
        .attr("stroke", ([region]) => colorScale(region))
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.7);

    // 범례 추가
    const legendContainer = d3.select(".scatter-legend");
    const regions = [...new Set(scatterData.map(d => d.행정구역))];

    regions.forEach((region, i) => {
        const legendRow = legendContainer.append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("margin-bottom", "5px")
            .on("mouseover", () => {
                marriageG.selectAll("circle")
                    .attr("opacity", d => (d.행정구역 === region ? 1 : 0.1));
                divorceG.selectAll("circle")
                    .attr("opacity", d => (d.행정구역 === region ? 1 : 0.1));

                marriageG.selectAll(".line")
                    .attr("stroke-opacity", ([grp]) => (grp === region ? 1 : 0.1));
                divorceG.selectAll(".line")
                    .attr("stroke-opacity", ([grp]) => (grp === region ? 1 : 0.1));
            })
            .on("mouseout", () => {
                marriageG.selectAll("circle").attr("opacity", 1);
                divorceG.selectAll("circle").attr("opacity", 1);
                marriageG.selectAll(".line").attr("stroke-opacity", 0.8);
                divorceG.selectAll(".line").attr("stroke-opacity", 0.8);
            });

        legendRow.append("div")
            .style("width", "8px")
            .style("height", "8px")
            .style("background-color", colorScale(region))
            .style("margin-right", "5px");

        legendRow.append("span")
            .style("font-size", "9px")
            .text(region);
    });

}).catch(error => {
    console.error("CSV 파일 로드 오류:", error);
});

// Tooltip 생성
const scatterTooltip = d3.select("body")
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