function Waveform({ data, progress }) {
    return (
        <div style={{
            display: "flex",
            alignItems: "flex-end",
            height: 30,
            gap: 2,
        }}>
            {data.map((amp, i) => (
                <div
                    key={i}
                    style={{
                        width: 3,
                        height: 5 + amp * 25,
                        background: i / data.length < progress ? "#4a90e2" : "#a0a0a0",
                        borderRadius: 2,
                        transition: "height 0.1s",
                    }}
                />
            ))}
        </div>
    );
}
export default Waveform;