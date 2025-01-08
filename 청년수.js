const youthSvg = d3.select("#youth-chart");
const youthMargin = { top: 40, right: 30, bottom: 60, left: 100 };
const youthWidth = +youthSvg.attr("width") - youthMargin.left - youthMargin.right;
const youthHeight = +youthSvg.attr("height") - youthMargin.top - youthMargin.bottom;
const youthG = youthSvg.append("g").attr("transform", `translate(${youthMargin.left},${youthMargin.top})`);

// Tooltip 생성
const youthTooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "10px")
    .style("background", "rgba(0, 0, 0, 0.7)")
    .style("color", "#fff")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);

fetch("청년수.xlsx")
    .then(response => response.arrayBuffer())
    .then(data => {
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const categories = ["아동", "청소년", "청년"];
        const regions = sheetData.map(row => row["행정기관"]);
        const populationData = sheetData.map(row =>
            categories.map(cat => {
                const value = row[cat]?.toString().replace(/,/g, "").trim();
                return isNaN(value) ? 0 : +value;
            })
        );

        const xScale = d3.scaleLinear()
            .domain([0, d3.max(populationData.flat())])
            .range([0, youthWidth]);

        const yScale = d3.scaleBand()
            .domain(regions)
            .range([0, youthHeight])
            .padding(0.1);

        const colorScale = d3.scaleOrdinal()
            .domain(categories)
            .range(d3.schemeCategory10);

        // X축
        youthG.append("g")
            .attr("transform", `translate(0, ${youthHeight})`)
            .call(d3.axisBottom(xScale).ticks(10))
            .call(g => g.append("text") // X축 오른쪽에 "(명)" 추가
                .attr("x", youthWidth)
                .attr("y", 40)
                .attr("fill", "#555")
                .attr("text-anchor", "end")
                .text("(명)"));

        // Y축
        youthG.append("g")
            .call(d3.axisLeft(yScale));

        // 막대그래프
        youthG.selectAll(".bar-group")
            .data(sheetData)
            .enter()
            .append("g")
            .attr("transform", d => `translate(0, ${yScale(d["행정기관"])})`)
            .selectAll("rect")
            .data((d, i) => categories.map((cat, index) => ({
                key: cat,
                value: isNaN(+d[cat]?.replace(/,/g, "").trim()) ? 0 : +d[cat]?.replace(/,/g, "").trim(),
                region: d["행정기관"],
                index
            })))
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", d => yScale.bandwidth() * 0.2 * d.index)
            .attr("width", d => xScale(d.value))
            .attr("height", yScale.bandwidth() * 0.2)
            .attr("fill", d => colorScale(d.key))
            .attr("opacity", 0.8)
            .on("mouseover", (event, d) => {
                youthTooltip.style("opacity", 1)
                    .html(`<strong></strong> ${d.region}<strong>,</strong> ${d.key}<br><strong></strong> ${d.value.toLocaleString()}명`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", () => {
                youthTooltip.style("opacity", 0);
            });

        // 범례 추가
        const legend = youthSvg.append("g")
            .attr("transform", `translate(${youthWidth - 150}, ${youthHeight + youthMargin.top - 420})`);
        legend.selectAll(".legend-item")
            .data(categories)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(${i * 100}, 0)`)
            .call(g => {
                g.append("rect")
                    .attr("width", 12)
                    .attr("height", 12)
                    .attr("fill", d => colorScale(d))
                    .attr("opacity", 0.8);

                g.append("text")
                    .attr("x", 15)
                    .attr("y", 10)
                    .attr("fill", "#555")
                    .text(d => d)
                    .style("font-size", "11px");
            });
    })
    .catch(error => {
        console.error("Error loading Youth Data:", error);
    });
