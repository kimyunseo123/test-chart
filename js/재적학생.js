const stackedSvg = d3.select("#stacked-bar-chart");
const stackedMargin = { top: 20, right: 50, bottom: 90, left: 100 };
const stackedWidth = +stackedSvg.attr("width") - stackedMargin.left - stackedMargin.right;
const stackedHeight = +stackedSvg.attr("height") - stackedMargin.top - stackedMargin.bottom;
const stackedG = stackedSvg.append("g").attr("transform", `translate(${stackedMargin.left},${stackedMargin.top})`);

// Tooltip 생성
const stackedTooltip = d3.select("body")
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
fetch("data/재적학생.xlsx")
    .then(response => response.arrayBuffer())
    .then(data => {
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // 데이터 변환 (서울 지역 필터링)
        const categories = ["재학생", "휴학생", "학사학위취득유예학생"];
        const filteredData = sheetData
            .filter(d => d["지역"] === "서울") // 서울 지역 필터링
            .filter(d => d.학교 !== "한국방송통신대학교") // 한국방송통신대학교 제외
            .map(d => ({
                학교: d["학교"],
                재학생: +d["재학생"],
                휴학생: +d["휴학생"],
                학사학위취득유예학생: +d["학사학위취득유예학생"]
            }));

        // 색상 스케일
        const colorScale = d3.scaleOrdinal()
            .domain(categories)
            .range(["#4BC0C0", "#FF9F40", "#36A2EB"]);

        // X축 및 Y축 스케일
        const xScale = d3.scaleBand()
            .domain(filteredData.map(d => d.학교))
            .range([0, stackedWidth])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.재학생 + d.휴학생 + d.학사학위취득유예학생)])
            .range([stackedHeight, 0]);

        // Stacked Data 생성
        const stacked = d3.stack()
            .keys(categories)
            .value((d, key) => d[key])(filteredData);

        // X축 및 Y축 추가
        stackedG.append("g")
            .attr("transform", `translate(0, ${stackedHeight})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "rotate(-35)")
            .style("text-anchor", "end")
            .style("font-size", "9px");

        stackedG.append("g")
            .call(d3.axisLeft(yScale).ticks(10).tickFormat(d => d.toLocaleString()));

        // Y축 레이블 추가
        stackedSvg.append("text")
            .attr("x", stackedMargin.left / 2 - 13) // Y축 중앙에 위치
            .attr("y", stackedMargin.top + 6) // Y축 위에 위치
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .attr("fill", "#555")
            .style("font-size", "10px")
            .text("(명)");


        // 막대 추가
        stackedG.selectAll(".layer")
            .data(stacked)
            .enter()
            .append("g")
            .attr("class", "layer")
            .attr("fill", d => colorScale(d.key))
            .selectAll("rect")
            .data(d => d)
            .enter()
            .append("rect")
            .attr("x", d => xScale(d.data.학교))
            .attr("y", d => yScale(d[1]))
            .attr("height", d => yScale(d[0]) - yScale(d[1]))
            .attr("width", xScale.bandwidth())
            .on("mouseover", (event, d) => {
                const category = categories[stacked.findIndex(layer => layer.includes(d))];
                const totalStudents = d.data.재학생 + d.data.휴학생 + d.data.학사학위취득유예학생;
                stackedTooltip.style("opacity", 1)
                    .html(`<strong>${d.data.학교}</strong><br>
                           <strong>${category}:</strong> ${(d[1] - d[0]).toLocaleString()}명<br>
                           <strong>재적학생:</strong> ${totalStudents.toLocaleString()}명`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", () => {
                stackedTooltip.style("opacity", 0);
            });

        // 범례 추가
        const legend = stackedSvg.append("g")
            .attr("transform", `translate(${stackedWidth + 15}, 25)`);

        categories.forEach((category, i) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(0, ${i * 20})`);

            legendRow.append("rect")
                .attr("width", 8)
                .attr("height", 8)
                .attr("fill", colorScale(category))
            legendRow.append("text")
                .attr("x", 12)
                .attr("y", 8)
                .text(category)
                .style("font-size", "10px");
        });
    })
    .catch(error => {
        console.error("Error loading data:", error);
    });