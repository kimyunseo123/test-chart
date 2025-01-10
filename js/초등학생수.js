// SVG 및 마진 설정
const elemSvg = d3.select("#elementary-chart");
const elemMargin = { top: 50, right: 200, bottom: 50, left: 100 };
const elemWidth = +elemSvg.attr("width") - elemMargin.left - elemMargin.right;
const elemHeight = +elemSvg.attr("height") - elemMargin.top - elemMargin.bottom;
const elemG = elemSvg.append("g").attr("transform", `translate(${elemMargin.left},${elemMargin.top})`);

// Tooltip 생성
const elemTooltip = d3.select("body")
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
fetch("data/초등학생수.xlsx")
    .then(response => response.arrayBuffer())
    .then(data => {
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // 데이터 변환
        const longFormatData = [];
        sheetData.forEach(row => {
            Object.keys(row).forEach(key => {
                if (!isNaN(+key)) {
                    longFormatData.push({
                        지역: row["시도별(1)"],
                        연도: +key,
                        초등학생수: +row[key]
                    });
                }
            });
        });

        // X축 및 Y축 스케일
        const elemXScale = d3.scaleLinear()
            .domain(d3.extent(longFormatData, d => d.연도))
            .range([0, elemWidth]);

        const elemYScale = d3.scaleLinear()
            .domain([0, d3.max(longFormatData, d => d.초등학생수)])
            .range([elemHeight, 0]);

        // 색상 스케일
        const elemColorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain([...new Set(longFormatData.map(d => d.지역))]);

        // X축 및 Y축 그리기
        elemG.append("g")
            .attr("transform", `translate(0, ${elemHeight})`)
            .call(d3.axisBottom(elemXScale).ticks(10).tickFormat(d3.format("d")));
        elemG.append("g").call(d3.axisLeft(elemYScale).ticks(10).tickFormat(d => d.toLocaleString()));

        // Y축 레이블
        elemSvg.append("text")
            .attr("x", hsMargin.left / 2 - 15) 
            .attr("y", hsMargin.top / 2 + 88) 
            .attr("text-anchor", "middle")
            .attr("fill", "#555")
            .style("font-size", "12px")
            .text("(명)");

        // 데이터 그룹화 (지역별)
        const groupedData = d3.group(longFormatData, d => d.지역);

        // 데이터 점 그리기
        elemG.selectAll(".point")
            .data(longFormatData)
            .enter()
            .append("circle")
            .attr("class", "point")
            .attr("cx", d => elemXScale(d.연도))
            .attr("cy", d => elemYScale(d.초등학생수))
            .attr("r", 5)
            .attr("fill", d => elemColorScale(d.지역))
            .attr("fill-opacity", 0.7) // 투명도
            .on("mouseover", (event, d) => {
                elemTooltip.style("opacity", 1)
                    .html(`${d.지역}<strong>,</strong> ${d.연도}년<br><strong>초등학생 수:</strong> ${d.초등학생수.toLocaleString()}명`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            }).on("mouseout", () => elemTooltip.style("opacity", 0));

        // 범례 추가
        const legend = elemSvg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${elemWidth + 180}, ${elemMargin.top})`);
        const legendItems = [...groupedData.keys()];
        legend.selectAll(".legend-item")
            .data(legendItems)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`)
            .each(function (d) {
                d3.select(this)
                    .append("rect")
                    .attr("width", 8)
                    .attr("height", 8)
                    .attr("fill", elemColorScale(d));
                d3.select(this)
                    .append("text")
                    .attr("x", 15)
                    .attr("y", 5)
                    .attr("text-anchor", "start")
                    .attr("alignment-baseline", "middle")
                    .style("font-size", "10px")
                    .text(d);
            });
    })
    .catch(error => {
        console.error("Error loading Excel file:", error);
    });