import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useSelector } from 'react-redux';

import './WeatherChart.css';

const WeatherChartHighchart = () => {
    // const city = useSelector((state) => state.selectedCity);
    const isExpanded = useSelector((state) => state.isExpanded);
    const selectedToggles = useSelector((state) => state.toggles);

    const variableData = useSelector((state) => state.variableData);

    const [clientHeight, setClientHeight] = useState(window.innerHeight);
    const [chartContainerClass, setChartContainerClass] = useState(320);

    const handleResize = () => {
        setClientHeight(window.innerHeight);
    };

    useEffect(() => {
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []); // Empty dependency array ensures this runs once on mount and unmount

    useEffect(() => {
        if (clientHeight > 900) {
            setChartContainerClass(420);
        } else {
            setChartContainerClass(320);
        }
    }, [clientHeight]);

    const generateContinuousLineData = () => {
        const continuousLineData = [];

        variableData.forEach(({ time, T_2m, rh_2m, ws_10m, precip_g, precip_c, precip_total, slp }) => {
            const timestamp = new Date(time).getTime();
            const newDataPoint = { time: timestamp };

            if (selectedToggles.includes('temperature')) {
                newDataPoint.temperature = Math.round(parseFloat(T_2m));
            }

            if (selectedToggles.includes('humidity')) {
                newDataPoint.humidity = Math.round(parseFloat(rh_2m));
            }

            if (selectedToggles.includes('wind_speed')) {
                newDataPoint.wind_speed = Math.round(parseFloat(ws_10m));
            }

            if (selectedToggles.includes('convectivePrecipitation')) {
                newDataPoint.convectivePrecipitation = parseFloat(precip_g);
            }

            if (selectedToggles.includes('nonConvectivePrecipitation')) {
                newDataPoint.nonConvectivePrecipitation = parseFloat(precip_c);
            }

            if (selectedToggles.includes('precipitation')) {
                newDataPoint.precipitation = parseFloat(precip_total);
            }

            if (selectedToggles.includes('pressure')) {
                newDataPoint.pressure = Math.round(parseFloat(slp));
            }

            continuousLineData.push(newDataPoint);
        });

        return continuousLineData;
    };

    const chartData = generateContinuousLineData();

    const getInfo = (toggle) => {
        switch (toggle) {
            case 'temperature':
                return ['Temperatura', '°C', '#ff3860'];
            case 'humidity':
                return ['Humidade rel.', '%', '#82ca9d'];
            case 'wind_speed':
                return ['Velocidade do vento', 'm/s', '#ffab0f '];
            case 'pressure':
                return ['Pressão', 'hPa', '#e67e22'];
            case 'precipitation':
                return ['Precipitação', 'mm', '#0088fe'];
            case 'convectivePrecipitation':
                return ['Prec. convectiva', 'mm', '#5dade2'];
            case 'nonConvectivePrecipitation':
                return ['Prec. não convectiva', 'mm', '#48c9b0'];
            default:
                return ['?', '?', '#000000'];
        }
    };

    const getYAxisConfigurations = () => {
        const precipitationRelatedToggles = ['precipitation', 'convectivePrecipitation', 'nonConvectivePrecipitation'];
        const anyPrecipitationSelected = selectedToggles.some(toggle => precipitationRelatedToggles.includes(toggle));
        let showPrecipitationYAxisLabel = false;

        return selectedToggles.map((toggle, index) => {
            const yAxisConfig = {
                title: {
                    text: getInfo(toggle)[1],
                    style: {
                        color: toggle === 'precipitation' || toggle === 'convectivePrecipitation' || toggle === 'nonConvectivePrecipitation'
                            ? getInfo('precipitation')[2] : getInfo(toggle)[2],
                    },
                    rotation: 0,
                    align: 'high',
                    offset: 20,
                    x: toggle === 'temperature' ? 15 : -15,
                    y: -10,
                },
                opposite: toggle === 'temperature' ? false : true,
                labels: {
                    style: {
                        color: toggle === 'precipitation' || toggle === 'convectivePrecipitation' || toggle === 'nonConvectivePrecipitation'
                            ? getInfo('precipitation')[2] : getInfo(toggle)[2],
                    },
                    x: toggle === 'temperature' ? -5 : 5,
                    y: 5
                },
                gridLineWidth: 0.5,
                gridLineColor: '#d3d3d3',
                // lineWidth: 1,
                // lineColor: getInfo(toggle)[2],
                tickColor: getInfo(toggle)[2],
            };

            const toggleData = chartData.map(data => data[toggle]);

            // Calculate min and max values
            const minValue = Math.min(...toggleData);
            const maxValue = Math.max(...toggleData);

            const range = maxValue - minValue === 0 ? 1 : maxValue - minValue;
            const orderOfMagnitude = Math.pow(10, Math.floor(Math.log10(range)));
            console.log('orderOfMagnitude:', orderOfMagnitude);
            const tickInterval = Math.ceil(range / (orderOfMagnitude * 5)) * orderOfMagnitude;

            yAxisConfig.min = Math.floor(minValue / tickInterval) * tickInterval === 0 ? 0 : Math.floor(minValue / tickInterval) * tickInterval - tickInterval;
            yAxisConfig.max = Math.ceil(maxValue / tickInterval) * tickInterval === 0 ? 1 : Math.ceil(maxValue / tickInterval) * tickInterval + tickInterval;
            yAxisConfig.tickInterval = tickInterval;

            if (precipitationRelatedToggles.includes(toggle)) {
                if (!showPrecipitationYAxisLabel && anyPrecipitationSelected) {
                    yAxisConfig.visible = true;
                    showPrecipitationYAxisLabel = true;
                } else {
                    yAxisConfig.visible = false;
                }
            } else {
                yAxisConfig.visible = true;
            }

            return yAxisConfig;
        });
    };


    const seriesData = selectedToggles.map((toggle, index) => ({
        name: getInfo(toggle)[0],
        data: chartData.map((data) => ({
            x: data.time,
            y: data[toggle]
        })),
        color: getInfo(toggle)[2],
        yAxis: index,
        xAxis: 0,
        lineWidth: 1.5,
        marker: {
            enabled: false
        },
    }));

    const options = {
        chart: {
            time: {
                timezone: 'Europe/Lisbon'
            },
            type: 'spline',
            animation: false,
            height: chartContainerClass,
            borderRadius: 10,
            spacingTop: 30,
            spacingBottom: 0,
            spacingLeft: 10,
            spacingRight: 30,
            alignTicks: false,
            style: {
                fontFamily: 'Inter',
            },
            legend: {
                margin: 0,
                align: 'left',
            },
        },
        title: {
            text: '',
        },
        xAxis: [
            {
                type: 'datetime',
                tickInterval: 6 * 3600 * 1000,
                startOnTick: false,
                endOnTick: false,
                crosshairs: true,
                labels: {
                    format: '{value:%H}h', // Display hours only
                },
                opposite: false,
                gridLineWidth: 0.5,
                gridLineColor: '#d3d3d3',
            },
            {
                linkedTo: 0,
                type: 'datetime',
                tickInterval: 24 * 3600 * 1000,
                labels: {
                    formatter: function () {
                        const date = new Date(this.value);
                        const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                        return `<b>${weekdays[date.getDay()]}</b> ${date.getDate()} ${date.toLocaleDateString('pt-BR', { month: 'short' })}`;
                    },
                    align: 'left',
                    x: 3,
                    y: 8
                },
                opposite: true,
                showEmpty: false,
                tickLength: 20,
                gridLineWidth: 1,
                gridLineColor: '#d3d3d3',
            }
        ],
        yAxis: getYAxisConfigurations(),
        tooltip: {
            crosshairs: true,
            shared: true,
            formatter: function () {
                let tooltipText = `<span style="font-size: 9px">${new Date(this.x).toLocaleString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: 'numeric' })}</span><br/>`;
                this.points.forEach(point => {
                    let toggle = point.series.userOptions.name;
                    let unit = '';

                    // Determine the unit based on the toggle name
                    switch (toggle) {
                        case 'Temperatura':
                            unit = '°C';
                            break;
                        case 'Humidade rel.':
                            unit = '%';
                            break;
                        case 'Precipitação':
                            unit = 'mm';
                            break;
                        case 'Pressão atmosférica':
                            unit = 'hPa';
                            break;
                        case 'Velocidade do vento':
                            unit = 'm/s';
                            break;
                        case 'Prec. convectiva':
                            unit = 'mm';
                            break;
                        case 'Prec. não convectiva':
                            unit = 'mm';
                            break;
                        default:
                            unit = '';
                    }

                    tooltipText += `<span style="color:${point.series.color}">\u25CF</span> ${point.series.name}: <b>${point.y} ${unit}</b><br/>`;
                });

                return tooltipText;
            }
        },
        series: seriesData,
    };

    return (
        <div className={`chart-container-${isExpanded ? 'expanded' : 'collapsed'}`}>
            <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
    );
};

export default WeatherChartHighchart;
