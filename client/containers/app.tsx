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
import { Box, css, TextField, Typography } from "@mui/material";
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

    const fetchData = () => props.PingStore!.fetch(start.unix(), end.unix());

    useDidMount(async () => {
      (window as any).enqueueSnackbar = enqueueSnackbar;
    });

    useEffect(() => {
      fetchData();
    }, [start, end]);

    return (
      <>
        <Box css={styles.root}>
          <Box>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box css={styles.datePicker}>
                <Box>
                  <DateTimePicker
                    label="開始日時"
                    ampm={false}
                    value={start}
                    onChange={(value: dayjs.Dayjs | null) => value && setStart(value)}
                    renderInput={(params) => <TextField {...params} />}
                  />
                </Box>
                <Box ml={2}>
                  <DateTimePicker
                    label="終了日時"
                    ampm={false}
                    value={end}
                    onChange={(value: dayjs.Dayjs | null) => value && setEnd(value)}
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