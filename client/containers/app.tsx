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
  ResponsiveContainer
} from "recharts";
import { Box, css, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField, Typography } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useDidMount } from "../utils/effects";
import type LoadingStore from "../stores/loading";
import type PingStore from "../stores/ping";

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
  menu: css({
    display: "flex",
    flexDirection: "row",
  }),
  rangeSelection: css({
    minWidth: 200,
  }),
  datePicker: css({
    display: "flex",
    flexDirection: "row",
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
]

export const App = inject("LoadingStore", "PingStore")(
  observer((props: IProps) => {
    const { enqueueSnackbar } = useSnackbar();
    const [start, setStart] = useState(dayjs().add(-3, "hours"));
    const [end, setEnd] = useState(dayjs());
    const [selectValue, setSelectValue] = useState<string | number>(-180);

    const fetchData = () => props.PingStore!.fetch(start.unix(), end.unix());

    useDidMount(async () => {
      (window as any).enqueueSnackbar = enqueueSnackbar;
      fetchData();
    });

    const onChangeSelect = (e: SelectChangeEvent<string | number>) => {
      setSelectValue(e.target.value);

      if (e.target.value === "") {
        return;
      }
      if (typeof e.target.value === "number") {
        const now = dayjs();
        setEnd(now);
        setStart(dayjs(now).add(e.target.value, "minutes"));
      }
      if (typeof e.target.value === "string") {
        switch (e.target.value) {
          case "today":
            setStart(dayjs().startOf("day"));
            setEnd(dayjs().endOf("day"));
            break;
          case "yesterday":
            setStart(dayjs().startOf("day").add(-1, "day"));
            setEnd(dayjs().endOf("day").add(-1, "day"));
          break;
        }
      }
      fetchData();
    };

    return (
      <>
        <Box css={styles.root}>
          <Box css={styles.menu}>
            <Box mr={2}>
              <FormControl variant="outlined">
                <InputLabel id="preset-label">プリセット</InputLabel>
                <Select labelId="preset-label" label={"プリセット"} onChange={onChangeSelect} value={selectValue} css={styles.rangeSelection}>
                  <MenuItem value="">-</MenuItem>
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
            </Box>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box css={styles.datePicker}> 
                <Box>
                  <DateTimePicker
                    label="開始日時"
                    ampm={false}
                    value={start}
                    onChange={(value: dayjs.Dayjs | null) => value && setStart(value)}
                    onAccept={() => {
                      setSelectValue("");
                      fetchData();
                    }}
                    renderInput={(params) => <TextField {...params} />}
                  />
                </Box>
                <Box ml={2}>
                  <DateTimePicker
                    label="終了日時"
                    ampm={false}
                    value={end}
                    onChange={(value: dayjs.Dayjs | null) => value && setEnd(value)}
                    onAccept={() => {
                      setSelectValue("");
                      fetchData();
                    }}
                    renderInput={(params) => <TextField {...params} />}
                  />
                </Box>
              </Box>
            </LocalizationProvider>
          </Box>
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
                    bottom: 5
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={"createdAt"} />
                  <YAxis unit={"ms"} max={100} />
                  <Tooltip />
                  <Legend />
                  {
                    props.PingStore!.latencyData.keys.map((key, index) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={colors[index % colors.length]}
                        dot={{ r: 0 }}
                      />
                    ))
                  }
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
                    bottom: 5
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={"createdAt"} />
                  <YAxis unit={"%"} max={100} />
                  <Tooltip />
                  <Legend />
                  {
                    props.PingStore!.packetLossData.keys.map((key, index) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={colors[index % colors.length]}
                        dot={{ r: 0 }}
                      />
                    ))
                  }
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </Box>
      </>
    );
  }),
);