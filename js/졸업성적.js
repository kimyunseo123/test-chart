// SVG 및 마진 설정
const histSvg = d3.select("#histogram-chart");
const histMargin = { top: 20, right: 30, bottom: 70, left: 100 };
const histWidth = +histSvg.attr("width") - histMargin.left - histMargin.right;
const histHeight = +histSvg.attr("height") - histMargin.top - histMargin.bottom;
const histG = histSvg.append("g").attr("transform", `translate(${histMargin.left},${histMargin.top})`);

// Tooltip 생성
const histTooltip = d3.select("body")
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
fetch("data/졸업성적.xlsx")
    .then(response => response.arrayBuffer())
    .then(data => {
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // 열 이름 확인 및 데이터 추출
        console.log("열 이름 확인:", Object.keys(sheetData[0]));

        // '졸업 백분율 점수 평균' 열 이름을 정확히 입력
        const graduationScores = sheetData
            .map(d => +d["졸업 백분율 점수 평균"]) // 열 이름을 정확히 매핑
            .filter(value => !isNaN(value)); // 숫자가 아닌 값 제거

        if (graduationScores.length === 0) {
            console.error("졸업성적 데이터가 비어 있습니다.");
            return;
        }

        // 히스토그램 설정
        const bins = d3.bin()
            .domain([70, 100]) // 데이터 범위 설정
            .thresholds(d3.range(70, 101, 1))(graduationScores);

        // X축 및 Y축 스케일
        const xScale = d3.scaleLinear()
            .domain([70, 100]) // 데이터 범위: 50 ~ 100
            .range([0, histWidth]);

        const yScale = d3.scaleLinear()
            .domain([0, 100]) // 데이터 범위: 0 ~ 200
            .range([histHeight, 0]);

        // X축 추가
        histG.append("g")
            .attr("transform", `translate(0, ${histHeight})`)
            .call(d3.axisBottom(xScale).ticks(31));

        // Y축 추가
        histG.append("g")
            .call(d3.axisLeft(yScale).ticks(11)); 

        // X축 제목 추가
        histSvg.append("text")
            .attr("class", "x-axis-label")
            .attr("x", histMargin.left + histWidth / 2 + 340 ) // 중앙 정렬
            .attr("y", histMargin.top + histHeight + 40) // 아래쪽 여백
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .attr("fill", "#555") 
            .text("(점)");

        // Y축 제목 추가
        histSvg.append("text")
            .attr("class", "y-axis-label")
            .attr("x", -popMargin.left + 110)
            .attr("y", 25)
            .attr("text-anchor", "start")
            .style("font-size", "12px")
            .attr("fill", "#555") 
            .text("(학교 수)");

        // 히스토그램 막대 추가
        histG.selectAll("rect")
            .data(bins)
            .enter()
            .append("rect")
            .attr("x", d => xScale(d.x0))
            .attr("y", d => yScale(d.length))
            .attr("width", d => xScale(d.x1) - xScale(d.x0) - 1) // 막대 폭
            .attr("height", d => histHeight - yScale(d.length))
            .attr("fill", "#4BC0C0")
            .on("mouseover", (event, d) => {
                histTooltip.style("opacity", 1)
                    .html(`<strong>구간:</strong> ${d.x0} ~ ${d.x1}<br><strong>학교 수:</strong> ${d.length}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", () => {
                histTooltip.style("opacity", 0);
            });

        console.log("히스토그램 데이터:", bins);
    })
    .catch(error => {
        console.error("Excel 파일 로드 오류:", error);
    });