import Hls from "hls.js"
import React, { ChangeEvent } from "react"
import { SUPPORTED_MIME_TYPES } from "../../constants"
import { IHTMLVideoElement, IProPlayerProps } from "../../types"
import { BiInfoSquare, BiLoader, BiPause, BiPlay } from "react-icons/bi"
import { MdFullscreen, MdOutlineForward10, MdReplay10 } from "react-icons/md"
import { ImVolumeMedium, ImVolumeLow, ImVolumeMute, ImVolumeHigh } from "react-icons/im"
import styles from "../../styles.module.css"
import { formatDuration } from "../../utils/formatDuration.util"
// import { showLogMessage } from "../../utils/showLogMessage.util"

const ProPlayer: React.FC<IProPlayerProps> = ({ title, source, showControls, isStaticVideo, poster }) => {
    const videoRef = React.useRef<IHTMLVideoElement>(null)
    const [isPlaying, setIsPlaying] = React.useState<boolean>(false)
    const [loading, setLoading] = React.useState<boolean>(true)
    const [showControls_, setShowControls_] = React.useState<boolean>(true)
    const [showVolumeSlider, setShowVolumeSlider] = React.useState<boolean>(false)
    // const [, setCurrentTime] = React.useState<string>('00:00')
    const [currentTimeInt, setCurrentTimeInt] = React.useState<number>(0)
    const [durationInt, setDurationInt] = React.useState<number>(0)
    const [duration, setDuration] = React.useState<string>('00:00')
    const [remainingduration, setRemainingDuration] = React.useState<string>('00:00')
    // const [, setRemainingDurationInt] = React.useState<number>(0)
    const [logMessage, setLogMessage] = React.useState<string>('00:00')
    const [isFullScreen, setIsFullScreen] = React.useState<boolean>(false)
    const [selectedQuality, setSelectedQuality] = React.useState<number>(0)
    const [volumeLevel, setVolumeLevel] = React.useState<number>(0)
    const [qualities, setQualities] = React.useState<number[]>([])

    React.useEffect(() => {
        onPlayerLoad()
    }, [source, isStaticVideo])

    React.useEffect(() => {
        if (showControls) setShowControls_(true)
        else setShowControls_(false)
    }, [showControls])

    // React.useEffect(() => {
    //     listenForMouseMoveOverVideoElement()
    // }, [])

    // React.useEffect(() => {
    //     toggleShowVideoControls()
    // }, [showControls_])

    function onPlayerLoad() {
        if (!source) {
            setLogMessage('video source not provided')
            return
        } else setLogMessage('')

        const video = videoRef.current

        if (!video) {
            // showLogMessage(showLogs, "video element not mounted on DOM", 'ERROR')
            return
        }

        setLoading(true)

        if (isStaticVideo) {
            listenForVideoPlayerEvents()
        } else { // set up player for HLS URL
            if (Hls.isSupported()) {
                const hls = new Hls()

                // showLogMessage(showLogs, "hls supported", 'LOG')

                video.hls = hls

                hls.loadSource(source)
                hls.attachMedia(video)
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    setQualities(hls.levels.map((level: any) => level.height))
                    setSelectedQuality(hls.levels.length - 1)
                    listenForVideoPlayerEvents()
                })
            } else if (video.canPlayType(SUPPORTED_MIME_TYPES[0])) {
                video.src = source
                listenForVideoPlayerEvents()
            }
        }
    }

    const handleQualityChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const newQuality = parseInt(event.target.value)
        const video = videoRef.current

        setSelectedQuality(newQuality)

        if (!video) {
            // showLogMessage('video element not mounted on DOM', 'ERROR')
            return
        }

        //*
        // video.addEventListener('loadstart', () => {
        //     setLoading(true)
        // })
        //*
        // video.addEventListener('canplaythrough', () => {
        //     setLoading(false)
        // })

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            const hls = video.hls

            if (hls && hls.levels[newQuality]) {
                hls.currentLevel = newQuality
            }
        }

        //*
        // return () => {
        //     video.removeEventListener('loadstart', handleLoadStart);
        //     video.removeEventListener('canplaythrough', handleCanPlayThrough);
        // };
    }

    function listenForVideoPlayerEvents() {
        const video = videoRef.current

        if (!video) {
            // showLogMessage(showLogs, "video element not mounted on DOM", 'ERROR')
            return
        }

        // showLogMessage(showLogs, 'loading metadata...', 'LOG')

        video.addEventListener('loadedmetadata', () => {
            setIsPlaying(video.paused)
            setDuration(formatDuration(video.duration))
            setDurationInt(video.duration)
            setLoading(false)
            console.log(video.volume)

            video.volume = 30 / 100
            setVolumeLevel(30)
        })

        video.addEventListener("timeupdate", () => {
            // setCurrentTime(formatDuration(video.currentTime))
            setCurrentTimeInt(video.currentTime)
            setRemainingDuration(formatDuration(video.duration - video.currentTime))
            // setRemainingDurationInt((video.duration - video.currentTime))
        })

        video.addEventListener("ended", () => {
            setIsPlaying(false)
        })

        video.addEventListener('waiting', () => {
            console.log('waiting')
            setLoading(true)
        })

        video.addEventListener('canplaythrough', () => {
            console.log('done waiting')
            setLoading(false)
        })

        //*
        // video.addEventListener('loadstart', () => {
        //     console.log('Video is loading...');
        //     setLoading(true)
        // });

        //*
        // video.addEventListener('loadeddata', () => {
        //     console.log('Video has finished loading.');
        //     setLoading(false)
        // });
    }

    // function listenForMouseMoveOverVideoElement() {
    //     const videoPlayerElement = document.querySelector('.playerVideo')

    //     if (!videoPlayerElement) return

    //     videoPlayerElement.addEventListener('mousemove', () => {
    //         setShowControls_(true)
    //     })
    // }

    // function toggleShowVideoControls() {
    //     const timeoutId = setTimeout(() => {
    //         // setShowControls_(false)
    //     }, 5000)

    //     return () => { clearTimeout(timeoutId) }
    // }

    const handlePlayPause = () => {
        const video = videoRef.current

        if (!video) {
            // showLogMessage(showLogs, 'video element not mounted on DOM', 'ERROR')
            return
        }

        if (isPlaying) video.pause()
        else video.play()
        setIsPlaying(!isPlaying)
    }

    const handleForwardRewind = (actionType: string) => {
        const video = videoRef.current

        if (!video) {
            // showLogMessage(showLogs, "video element not mounted on DOM", 'ERROR')
            return
        }

        if (actionType === "FORWARD") video.currentTime += 10
        if (actionType === "REWIND") video.currentTime -= 10
    }

    const toggleFullScreen = () => {
        const video = videoRef.current

        if (!video) {
            // showLogMessage(showLogs, 'video element not mounted on DOM', 'ERROR')
            return
        }

        if (isFullScreen) document.exitFullscreen()
        else video.requestFullscreen()
        setIsFullScreen(!isFullScreen)
    }

    const handleProgress = (event: any) => {
        const seekTime = event.target.value
        const video = videoRef.current

        if (!video) {
            // showLogMessage(showLogs, 'video element not mounted on DOM', 'ERROR')
            return
        }

        video.currentTime = seekTime

        setCurrentTimeInt(seekTime)
        setCurrentTimeInt(video.currentTime)
        setRemainingDuration(formatDuration(video.duration - video.currentTime))
        // setCurrentTime(formatDuration(seekTime))
    }

    const onVideoElementHover = () => {
        // setShowControls_(true)
    }

    const handleChangeVolume = (event: ChangeEvent<HTMLInputElement>) => {
        const video = videoRef.current
        const volumeLevel_ = Number(event.target.value) / 100

        if (!video) {
            // showLogMessage(showLogs, 'video element not mounted on DOM', 'ERROR')
            return
        }

        setVolumeLevel(volumeLevel_ * 100)
        video.volume = volumeLevel_
    }

    return (
        <div>
            <div className={styles.playerContainer}>
                {logMessage && <div className={styles.playerContainerOverlay}>
                    <div className={styles.playerLogMessageContainerOverlay}>
                        <div><BiInfoSquare size={30} /></div>
                        <p>{logMessage}</p>
                    </div>
                </div>}

                {loading && <div className={styles.playerContainerOverlay}>
                    <div className={styles.playerContainerOverlaySpinner}><BiLoader size={30} /></div>
                </div>}

                <span>
                    <video poster={poster} onMouseEnter={onVideoElementHover} ref={videoRef} autoPlay className={styles.playerVideo} src={source}>
                        Your browser does not support the video tag.
                    </video>

                    {showControls_ &&
                        <div className={styles.playerControls}>
                            <div className={styles.playerControlsMainWrapper}>
                                <div className={styles.playerProgressRangeWrapper}>
                                    <input type="range" min="0" max={durationInt} value={currentTimeInt} onChange={handleProgress} className={styles.playerProgressRange} />
                                    <p>{remainingduration === '00:00' ? duration : remainingduration}</p>
                                </div>

                                <div className={styles.playerControlsWrapper}>
                                    <div className={styles.playerControlCol}>
                                        <div className={styles.playerControlCol}>
                                            <span onClick={handlePlayPause}>
                                                {isPlaying
                                                    ? <button><BiPause size={33} /></button>
                                                    : <button><BiPlay size={33} /></button>}
                                            </span>
                                        </div>
                                        <button><MdReplay10 onClick={() => handleForwardRewind("REWIND")} size={30} /></button>
                                        <button><MdOutlineForward10 onClick={() => handleForwardRewind("FORWARD")} size={30} /></button>
                                        <div className={styles.playerVolumeColWrapper} onMouseLeave={() => setShowVolumeSlider(false)} onMouseEnter={() => setShowVolumeSlider(true)} onClick={() => setShowVolumeSlider(true)} >
                                            {volumeLevel > 0 && volumeLevel < 70 && <button><ImVolumeLow size={26} /></button>}
                                            {volumeLevel >= 70 && volumeLevel < 100 && <button><ImVolumeMedium size={26} /></button>}
                                            {volumeLevel === 0 && <button><ImVolumeMute size={26} /></button>}
                                            {volumeLevel === 100 && <button><ImVolumeHigh size={26} /></button>}
                                            {showVolumeSlider && <input type="range" value={volumeLevel} onChange={handleChangeVolume} className={styles.playerVolumeProgressRange} />}
                                        </div>
                                    </div>
                                    <p className={styles.playerTitle}>{title}</p>
                                    <div className={styles.playerControlCol}>
                                        {!isStaticVideo && qualities.length > 0 && (
                                            <select value={selectedQuality} onChange={handleQualityChange} className={styles.playerQualitySelector}>
                                                {qualities.map((quality, index) => (
                                                    <option key={index} value={index}>
                                                        {quality}
                                                    </option>
                                                ))}
                                            </select>
                                        )}

                                        <button><MdFullscreen onClick={toggleFullScreen} size={30} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                </span>
            </div>
        </div>
    )
}

export default ProPlayer
