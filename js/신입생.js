// SVG 및 마진 설정
const bubbleSvg = d3.select("#bubble-chart");
const bubbleMargin = { top: 20, right: 20, bottom: 20, left: 20 };
const bubbleWidth = +bubbleSvg.attr("width");
const bubbleHeight = +bubbleSvg.attr("height");

// Tooltip 생성
const bubbleTooltip = d3.select("body")
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
fetch("data/신입생.xlsx")
    .then(response => response.arrayBuffer())
    .then(data => {
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // 데이터 변환
        const bubbleData = sheetData.map(d => ({
            학교명: d["학교명"],
            모집인원: +d["모집인원"],
            경쟁률: +d["경쟁률(%)"]
        }))
        .filter(d => !isNaN(d.모집인원) && !isNaN(d.경쟁률))
        .filter(d => d.학교명 !== "한국방송통신대학교"); // 한국방송통신대학교 제외

        // 색상 스케일
        const colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([d3.min(bubbleData, d => d.경쟁률), d3.max(bubbleData, d => d.경쟁률)]);

        // Hierarchical data 구조로 변환
        const root = d3.hierarchy({ children: bubbleData })
            .sum(d => d.모집인원);

        // Pack Layout 설정
        const pack = d3.pack()
            .size([bubbleWidth, bubbleHeight])
            .padding(5);

        // 노드 데이터 생성
        const nodes = pack(root).leaves();

        // 버블 추가
        const bubbles = bubbleSvg.selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => d.r)
            .attr("fill", d => colorScale(d.data.경쟁률))
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .on("mouseover", (event, d) => {
                bubbleTooltip.style("opacity", 1)
                    .html(`<strong>학교명:</strong> ${d.data.학교명}<br><strong>모집인원:</strong> ${d.data.모집인원}명<br><strong>경쟁률:</strong> ${d.data.경쟁률}%`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", () => {
                bubbleTooltip.style("opacity", 0);
            });

        // 텍스트 추가 (옵션)
        bubbleSvg.selectAll("text")
            .data(nodes)
            .enter()
            .append("text")
            .attr("x", d => d.x)
            .attr("y", d => d.y)
            .attr("text-anchor", "middle")
            .attr("dy", ".3em")
            .style("font-size", d => `${Math.min(12, d.r / 3)}px`)
            .style("fill", "#fff")
            .text(d => d.data.학교명);
    })
    .catch(error => {
        console.error("Error loading data:", error);
    });