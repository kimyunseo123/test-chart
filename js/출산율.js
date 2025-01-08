const birthSvg = d3.select("#birth-rate-chart");
const birthMargin = { top: 20, right: 120, bottom: 60, left: 70 };
const birthWidth = +birthSvg.attr("width") - birthMargin.left - birthMargin.right;
const birthHeight = +birthSvg.attr("height") - birthMargin.top - birthMargin.bottom;
const birthG = birthSvg.append("g").attr("transform", `translate(${birthMargin.left},${birthMargin.top})`);

// Tooltip 생성
const birthTooltip = d3.select("body")
    .append("div")
    .attr("class", "birth-tooltip")
    .style("position", "absolute")
    .style("padding", "10px")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

// X축 및 Y축 그룹 추가
const birthXAxisGroup = birthG.append("g").attr("transform", `translate(0, ${birthHeight})`);
const birthYAxisGroup = birthG.append("g");

// Y축 제목 추가
birthSvg.append("text")
    .attr("class", "birth-y-axis-label")
    .attr("x", -birthHeight / 2)
    .attr("y", birthMargin.left / 2 - 10)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("fill", "#555")
    .text("출산율 (%)")
    .style("font-size", "11px");

// 엑셀 파일 로드
fetch("data/출산율.xlsx")
    .then(response => response.arrayBuffer())
    .then(data => {
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // 데이터 변환 (Wide to Long)
        const longFormatData = [];
        sheetData.forEach(row => {
            Object.keys(row).forEach(key => {
                if (!isNaN(+key)) {
                    longFormatData.push({
                        지역: row["행정구역별"],
                        연도: +key,
                        출산율: +row[key]
                    });
                }
            });
        });

        // X축 및 Y축 스케일
        const birthXScale = d3.scaleLinear()
            .domain(d3.extent(longFormatData, d => d.연도))
            .range([0, birthWidth]);

        const birthYScale = d3.scaleLinear()
            .domain([0.5, 1.5]) // Y축 범위 설정
            .range([birthHeight, 0]);

        // 색상 스케일
        const birthColorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain([...new Set(longFormatData.map(d => d.지역))]);

        // X축 및 Y축 그리기
        birthXAxisGroup.call(d3.axisBottom(birthXScale).ticks(5).tickFormat(d3.format("d")));
        birthYAxisGroup.call(d3.axisLeft(birthYScale).ticks(11)); // 0.1 단위로 표시

        // 데이터 그룹화 (지역별)
        const groupedData = d3.group(longFormatData, d => d.지역);

        // 선 그리기
        birthG.selectAll(".line")
            .data(groupedData)
            .enter()
            .append("path")
            .attr("class", "line")
            .attr("d", ([key, values]) => {
                return d3.line()
                    .x(d => birthXScale(d.연도))
                    .y(d => birthYScale(d.출산율))
                    .curve(d3.curveMonotoneX)(values);
            })
            .attr("fill", "none")
            .attr("stroke", ([key]) => birthColorScale(key))
            .attr("stroke-width", 2)
            .attr("opacity", 0.5);

        // 데이터 점 그리기
        birthG.selectAll(".birth-point")
            .data(longFormatData)
            .enter()
            .append("circle")
            .attr("class", "birth-point")
            .attr("cx", d => birthXScale(d.연도))
            .attr("cy", d => birthYScale(d.출산율))
            .attr("r", 4) // 점 크기
            .attr("fill", d => birthColorScale(d.지역))
            .attr("fill-opacity", 0.7) // 투명도
            .on("mouseover", (event, d) => {
                birthTooltip.style("opacity", 1)
                    .html(`<strong>지역:</strong> ${d.지역}<br><strong>출산율:</strong> ${d.출산율.toFixed(3)}%`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", () => {
                birthTooltip.style("opacity", 0);
            });

        // 범례 추가
        const legend = birthSvg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${birthWidth + 100}, ${birthMargin.top + 3})`);

        const legendItems = [...groupedData.keys()];
        legend.selectAll(".legend-item")
        .data(legendItems)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`)
        .each(function(d) {
            d3.select(this)
                .append("rect")
                .attr("width", 8)
                .attr("height", 8)
                .attr("fill", birthColorScale(d));

            d3.select(this)
                .append("text")
                .attr("x", 10)
                .attr("y", 5)
                .attr("text-anchor", "start")
                .attr("alignment-baseline", "middle")
                .attr("fill", "#555")
                .style("font-size", "10px")
                .text(d);
        })
        .on("mouseover", (event, region) => {
            // 모든 선과 점을 투명하게 만듦
            birthG.selectAll(".line")
                .attr("opacity", 0.1);
            birthG.selectAll(".birth-point")
                .attr("opacity", 0.1);

            // 해당 지역의 선과 점만 강조
            birthG.selectAll(".line")
                .filter(([key]) => key === region)
                .attr("opacity", 1);

            birthG.selectAll(".birth-point")
                .filter(d => d.지역 === region)
                .attr("opacity", 1);
        })
        .on("mouseout", () => {
            // 모든 선과 점을 원래 상태로 복구
            birthG.selectAll(".line")
                .attr("opacity", 0.5);
            birthG.selectAll(".birth-point")
                .attr("opacity", 0.7);
        });
    })
    .catch(error => {
        console.error("Error loading Excel file:", error);
    });