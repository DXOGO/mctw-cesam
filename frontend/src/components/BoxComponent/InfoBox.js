import "./InfoBox.css"
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveButton } from "../../redux/actions";
import { fetchWeeklyDataSuccess } from '../../redux/actions';

import {
    setWeatherIcon,
} from '../../helpers/helpers';

import WeatherBox from './WeatherBox';
import GraphBox from './GraphBox';

import { FaTable } from "react-icons/fa";
import { BiStats } from "react-icons/bi";

import AtmosphericDataIcon from "../AtmosphericDataIcon/AtmosphericDataIcon";

const InfoBox = () => {

    const getFormattedDate = (date) => {
        const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const monthsOfYear = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

        const dayOfWeek = daysOfWeek[date.getUTCDay()];
        const day = date.getUTCDate().toString().padStart(2, '0');
        const month = monthsOfYear[date.getUTCMonth()];
        const year = date.getUTCFullYear();
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const seconds = date.getUTCSeconds().toString().padStart(2, '0');

        return `${dayOfWeek}, ${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
    };

    const dispatch = useDispatch();

    const activeButton = useSelector(state => state.activeButton);
    const city = useSelector(state => state.selectedCity);
    const cityDailyData = city.cityDailyData;

    const isExpanded = useSelector(state => state.isExpanded);

    const nowString = useSelector((state) => state.currentDate);
    const dateOnlyHour = new Date(nowString);
    dateOnlyHour.setMinutes(0)
    dateOnlyHour.setSeconds(0)

    const [isLoading, setIsLoading] = useState(false);

    const handleButtonClick = (buttonName) => {
        dispatch(setActiveButton(buttonName));
    };

    const [weatherData, setWeatherData] = useState({
        temperature: 0,
        wind: { speed: 0, direction: 0 },
        humidity: 0,
        precipitation: 0,
        clouds: 0,
    });

    const [currentDate, setCurrentDate] = useState(new Date(nowString));

    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentDate(prevDate => new Date(prevDate.getTime() + 1000));
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    const currentData = cityDailyData.find(item => new Date(item.time).getTime() === new Date(dateOnlyHour).getTime()) ? cityDailyData.find(item => new Date(item.time).getTime() === new Date(dateOnlyHour).getTime()) : cityDailyData[0];

    useEffect(() => {
        setWeatherData({
            temperature: currentData.T_2m,
            wind: { speed: currentData.ws_10m, direction: currentData.wd_10m },
            humidity: currentData.rh_2m,
            precipitation: currentData.precip_total,
            clouds: currentData.cldfrac,
        });
    }, [currentData]);

    const weatherIcon = setWeatherIcon(
        weatherData.precipitation,
        weatherData.clouds,
        weatherData.humidity,
        dateOnlyHour
    );

    useEffect(() => {
        const fetchWeeklyDataForCity = async () => {
            console.log('Fetching weekly data for city:', city.name);
            try {
                const response = await fetch(`http://localhost:3001/api/data/${city.id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                const data = await response.json();
                dispatch(fetchWeeklyDataSuccess(data));
                setIsLoading(false);
                console.log(`Weekly data for ${city.name} fetched successfully`);
            } catch (error) {
                console.error('Error fetching data: ', error);
                setIsLoading(false);
            }
        }
        setIsLoading(true);
        fetchWeeklyDataForCity();
    }, [dispatch, city]);

    const renderState = activeButton === "graph" ? <GraphBox loading={isLoading} /> : <WeatherBox />;

    const variables = ["precipitation", "humidity", "wind", "iqa"];
    const commonProps = { humidity: weatherData.humidity, wind: weatherData.wind, precipitation: weatherData.precipitation };

    return (
        <div className={`info-box ${activeButton} ${isExpanded ? "expanded" : "collapsed"}`}>
            <div className="info-header">
                <p className="box-text">{city.name}</p>
                <div className="separator" />
                <p className="date-text">{getFormattedDate(currentDate)}</p>
            </div>
            <div className={`info-content ${activeButton}`}>
                <div className={`info-row ${activeButton} ${isExpanded ? "expanded" : "collapsed"}`}>
                    <div className={`info-icon ${isExpanded ? "expanded" : "collapsed"}`}>
                        <img src={weatherIcon.icon} alt={weatherIcon.alt} className="info-weather-icon" />
                    </div>
                    <div className={`temperature ${isExpanded ? "expanded" : "collapsed"}`}>
                        <span className="temperature-text">{parseFloat(weatherData.temperature).toFixed(0)}</span>
                        <span className="temperature-unit">°C</span>
                    </div>
                    {isExpanded ? (
                        <div className="expanded-atmospheric-data">
                            <div className="row">
                                {variables.map((variable, index) => (
                                    <AtmosphericDataIcon key={index} type_data={variable} {...commonProps} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="collapsed-atmospheric-data">
                            <div className="column">
                                {variables.slice(0, 2).map((variable, index) => (
                                    <AtmosphericDataIcon key={index} type_data={variable} {...commonProps} />
                                ))}
                            </div>
                            <div className="column">
                                {variables.slice(2).map((variable, index) => (
                                    <AtmosphericDataIcon key={index + 2} type_data={variable} {...commonProps} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className={`info-buttons-${activeButton} ${isExpanded ? "expanded" : "collapsed"}`}>
                    <button className={activeButton === "table" ? "active" : ""} onClick={() => handleButtonClick("table")}>
                        Tabela <FaTable style={{ marginLeft: "8px", transform: "scale(1.2)" }} />
                    </button>
                    <button className={activeButton === "graph" ? "active" : ""} onClick={() => handleButtonClick("graph")}>
                        Gráfico <BiStats style={{ marginLeft: "8px", transform: "scale(1.6)" }} />
                    </button>
                </div>
                {renderState}
            </div>
        </div>
    );
}

export default InfoBox;