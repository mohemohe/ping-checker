import React, { useEffect, useState } from "react";
import { inject, observer } from "mobx-react";
import { useSnackbar } from "notistack";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Box,
  Button,
  css,
  FormControl,
  Grid,
  Icon,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useDidMount } from "../utils/effects";
import type LoadingStore from "../stores/loading";
import type PingStore from "../stores/ping";
import Logger from "../utils/logger";

dayjs.locale("ja");

interface IProps {
  LoadingStore?: typeof LoadingStore;
  PingStore?: typeof PingStore;
}

const styles = {
  root: css({
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    padding: "1rem",
  }),
  datePicker: css({
    width: "100%",
  }),
  gridButton: css({
    height: "100%",
  }),
  section: css({
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflow: "hidden",
  }),
  graph: css({
    flex: 1,
  }),
};

const colors = [
  "#f06292",
  "#64b5f6",
  "#81c784",
  "#ffd54f",
  "#9575cd",
  "#4dd0e1",
  "#dce775",
  "#ff8a65",
];

let autoRefreshHandler: number;
let timerHandler: number;
let lastAccessTime: dayjs.Dayjs;

export const App = inject(
  "LoadingStore",
  "PingStore"
)(
  observer((props: IProps) => {
    const { enqueueSnackbar } = useSnackbar();
    const [start, setStart] = useState(dayjs().add(-3, "hours"));
    const [end, setEnd] = useState(dayjs());
    const [selectRangeValue, setSelectRangeValue] = useState<string | number>(-180);
    const [autoRefreshIntervalValue, setAutoRefreshIntervalValue] = useState<string | number>("disabled");
    const [timerValue, setTimerValue] = useState<number>(0);

    const fetchData = (startUnix: number, endUnix: number, loading?: boolean) =>
      props.PingStore!.fetch(startUnix, endUnix, loading);

    useDidMount(async () => {
      (window as any).enqueueSnackbar = enqueueSnackbar;
      fetchData(start.unix(), end.unix());
    });

    const calcRange = (preset: number) => {
      const now = dayjs();
      const start = dayjs(now).add(preset, "minutes");
      const end = now;

      Logger.debug("App calcRange()", "preset:", preset, "start:", start.toDate(), "end:", end.toDate());
      return {
        start,
        end,
      };
    };

    const stopAutoRefresh = () => {
      if (autoRefreshHandler) {
        Logger.debug("App stopAutoRefresh()", "clearInterval autoRefreshHandler");
        clearInterval(autoRefreshHandler);
      }
      if (timerHandler) {
        Logger.debug("App stopAutoRefresh()", "clearInterval timerHandler");
        clearInterval(timerHandler);
      }
      setAutoRefreshIntervalValue("disabled");
      setTimerValue(0);
    };

    const onChangeRangeSelect = (e: SelectChangeEvent<string | number>) => {
      Logger.debug("App onChangeRangeSelect()", "new selectRangeValue:", e.target.value);
      stopAutoRefresh();

      let start;
      let end;
      if (typeof e.target.value === "number") {
        const range = calcRange(e.target.value);
        start = range.start;
        end = range.end;
      } else {
        switch (e.target.value) {
          case "today":
            start = dayjs().startOf("day");
            end = dayjs().endOf("day");
            break;
          case "yesterday":
            start = dayjs().startOf("day").add(-1, "day");
            end = dayjs().endOf("day").add(-1, "day");
            break;
          default:
            return;
        }
      }
      setStart(start);
      setEnd(end);
      setSelectRangeValue(e.target.value);
      fetchData(start.unix(), end.unix());
    };

    const onChangeAutoRefreshIntervalValue = (e: SelectChangeEvent<string | number>) => {
      Logger.debug("App onChangeRangeSelect()", "new autoRefreshIntervalValue:", e.target.value);

      if (autoRefreshHandler) {
        clearInterval(autoRefreshHandler);
      }
      if (timerHandler) {
        clearInterval(timerHandler);
      }

      if (typeof e.target.value === "number" && typeof selectRangeValue === "number") {
        const intervalSec = e.target.value;

        lastAccessTime = dayjs();
        autoRefreshHandler = setInterval(() => {
          lastAccessTime = dayjs();

          const { start, end } = calcRange(selectRangeValue);
          fetchData(start.unix(), end.unix(), false);

          setStart(start);
          setEnd(end);
        }, intervalSec * 1000);
        timerHandler = setInterval(() => {
          const now = dayjs();
          const diff = lastAccessTime.diff(now, "seconds", true);
          const value = (Math.abs(diff) * 100) / (intervalSec - 1);
          setTimerValue(value);
        }, 1000);
      }
      setAutoRefreshIntervalValue(e.target.value)
    };

    return (
      <>
        <Box css={styles.root}>
          <Grid container spacing={2} alignItems={"stretch"}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid item xs={6} md={3}>
                <DateTimePicker
                  css={styles.datePicker}
                  label="開始日時"
                  ampm={false}
                  value={start}
                  onChange={(value: dayjs.Dayjs | null) =>
                    value && setStart(value)
                  }
                  onAccept={(value: dayjs.Dayjs | null) => {
                    stopAutoRefresh();
                    setSelectRangeValue("custom");
                    fetchData((value || start).unix(), end.unix());
                  }}
                  renderInput={(params) => <TextField {...params} />}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <DateTimePicker
                  css={styles.datePicker}
                  label="終了日時"
                  ampm={false}
                  value={end}
                  onChange={(value: dayjs.Dayjs | null) =>
                    value && setEnd(value)
                  }
                  onAccept={(value: dayjs.Dayjs | null) => {
                    setSelectRangeValue("custom");
                    stopAutoRefresh();
                    fetchData(start.unix(), (value || end).unix());
                  }}
                  renderInput={(params) => <TextField {...params} />}
                />
              </Grid>
            </LocalizationProvider>
            <Grid item xs={6} md={2}>
              <FormControl variant="outlined" fullWidth>
                <InputLabel id="preset-label">プリセット</InputLabel>
                <Select
                  labelId="preset-label"
                  label={"プリセット"}
                  onChange={onChangeRangeSelect}
                  value={selectRangeValue}
                >
                  {selectRangeValue === "custom" && (
                    <MenuItem value="custom">カスタム</MenuItem>
                  )}
                  <MenuItem value={-5}>5分</MenuItem>
                  <MenuItem value={-15}>15分</MenuItem>
                  <MenuItem value={-30}>30分</MenuItem>
                  <MenuItem value={-60}>1時間</MenuItem>
                  <MenuItem value={-180}>3時間</MenuItem>
                  <MenuItem value={-360}>6時間</MenuItem>
                  <MenuItem value={-720}>12時間</MenuItem>
                  <MenuItem value={-1440}>24時間</MenuItem>
                  <MenuItem value={"today"}>今日</MenuItem>
                  <MenuItem value={"yesterday"}>昨日</MenuItem>
                  <MenuItem value={-4320}>3日</MenuItem>
                  <MenuItem value={-10080}>7日</MenuItem>
                  <MenuItem value={-20160}>14日</MenuItem>
                  <MenuItem value={-43200}>30日</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3} md={2}>
              <Box position={"relative"}>
                <FormControl variant={"outlined"} fullWidth>
                  <InputLabel id="autorefresh-label">自動更新</InputLabel>
                  <Select
                    labelId="autorefresh-label"
                    label={"自動更新"}
                    onChange={onChangeAutoRefreshIntervalValue}
                    value={autoRefreshIntervalValue}
                    disabled={typeof selectRangeValue === "string"}
                  >
                    <MenuItem value={"disabled"}>-</MenuItem>
                    {typeof selectRangeValue === "number" && selectRangeValue >= -60 && <MenuItem value={2}>2秒</MenuItem>}
                    <MenuItem value={10}>10秒</MenuItem>
                    <MenuItem value={30}>30秒</MenuItem>
                    <MenuItem value={60}>1分</MenuItem>
                  </Select>
                </FormControl>
                <Box position={"absolute"} bottom={0} left={0} right={0}>
                  <LinearProgress variant={"determinate"} value={timerValue} />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={3} md={2}>
              <Button
                css={styles.gridButton}
                variant={"outlined"}
                fullWidth
                startIcon={<Icon>refresh</Icon>}
                disabled={typeof selectRangeValue === "string"}
                onClick={() => {
                  props.LoadingStore!.lockLoading();
                  try {
                    lastAccessTime = dayjs();
                    const { start, end } = calcRange(selectRangeValue as number);
                    setStart(start);
                    setEnd(end);
                    fetchData(start.unix(), end.unix());
                  } finally {
                    props.LoadingStore!.unlockLoading();
                  }
                }}
              >
                更新
              </Button>
            </Grid>
          </Grid>
          <Box css={styles.section}>
            <Typography variant={"h4"}>レイテンシ―</Typography>
            <Box css={styles.graph}>
              <ResponsiveContainer>
                <LineChart
                  width={500}
                  height={300}
                  syncId={"chart"}
                  data={props.PingStore!.latencyData.data}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={"createdAt"} />
                  <YAxis unit={"ms"} max={100} />
                  <Tooltip />
                  <Legend />
                  {props.PingStore!.latencyData.keys.map((key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={colors[index % colors.length]}
                      dot={{ r: 0 }}
                      isAnimationActive={!autoRefreshHandler}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Box>
          <Box css={styles.section}>
            <Typography variant={"h4"}>パケットロス</Typography>
            <Box css={styles.graph}>
              <ResponsiveContainer>
                <LineChart
                  width={500}
                  height={300}
                  syncId={"chart"}
                  data={props.PingStore!.packetLossData.data}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={"createdAt"} />
                  <YAxis unit={"%"} max={100} />
                  <Tooltip />
                  <Legend />
                  {props.PingStore!.packetLossData.keys.map((key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={colors[index % colors.length]}
                      dot={{ r: 0 }}
                      isAnimationActive={!autoRefreshHandler}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </Box>
      </>
    );
  })
);
